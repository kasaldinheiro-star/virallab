"""
Busca notícias/tendências de produtos por categoria fixa usando Google News
RSS. Tecnologia busca também em inglês (maior cobertura de gadgets).
Filtra por data de publicação (máximo 30 dias) e remove duplicados.

Rodar manualmente:
    python scripts/fetch_product_trends.py
"""

import os
import re
import sys
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote
import xml.etree.ElementTree as ET

import requests
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.")
    sys.exit(1)

MAX_POR_CATEGORIA = 10
MAX_DIAS_ANTIGUIDADE = 30

# Cada categoria pode buscar em mais de um idioma/região: (query, hl, gl)
CATEGORIAS = {
    "tecnologia": [
        ('"lançamento smartphone" OR "novo notebook" OR "gadget 2026"', "pt-BR", "BR"),
        ('"new gadget launch" OR "best tech 2026" OR "smartphone review"', "en-US", "US"),
    ],
    "casa": [
        ('"decoração tendência" OR "produtos para casa" OR "eletrodoméstico lançamento" OR "achadinhos casa"', "pt-BR", "BR"),
    ],
    "cama_banho": [
        ('"jogo de cama lançamento" OR "toalha tendência" OR "travesseiro" OR "edredom"', "pt-BR", "BR"),
    ],
    "fitness": [
        ('"tênis de corrida lançamento" OR "suplemento tendência" OR "equipamento academia" OR "roupa fitness"', "pt-BR", "BR"),
    ],
    "dia_a_dia": [
        ('"produtos virais" OR "achadinhos do dia a dia" OR "utensílios em alta"', "pt-BR", "BR"),
    ],
}


def idade_em_dias(pub_date_str: str | None) -> int | None:
    if not pub_date_str:
        return None
    try:
        data_pub = parsedate_to_datetime(pub_date_str)
        if data_pub.tzinfo is None:
            data_pub = data_pub.replace(tzinfo=timezone.utc)
        agora = datetime.now(timezone.utc)
        return (agora - data_pub).days
    except Exception:
        return None


def normalizar_titulo(titulo: str) -> str:
    sem_fonte = re.split(r"\s[-–]\s", titulo)[0]
    return re.sub(r"[^a-z0-9]", "", sem_fonte.lower())


def buscar_rss(query: str, hl: str, gl: str) -> list[dict]:
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl={hl}&gl={gl}&ceid={gl}:{hl.split('-')[0]}"
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        return root.findall(".//item")
    except Exception as e:
        print(f"  Erro ao buscar RSS ({hl}/{gl}): {e}")
        return []


def buscar_por_categoria(categoria: str, buscas: list[tuple[str, str, str]]) -> list[dict]:
    temas = []
    titulos_vistos: set[str] = set()

    for query, hl, gl in buscas:
        items = buscar_rss(query, hl, gl)

        for item in items:
            titulo = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = item.findtext("pubDate")

            if not titulo:
                continue

            chave = normalizar_titulo(titulo)
            if chave in titulos_vistos:
                continue

            dias = idade_em_dias(pub_date)
            if dias is None or dias > MAX_DIAS_ANTIGUIDADE:
                continue

            titulos_vistos.add(chave)

            temas.append(
                {
                    "categoria": categoria,
                    "titulo": titulo,
                    "fonte_url": link,
                    "score": max(MAX_POR_CATEGORIA - dias, 1),
                    "data_coleta": date.today().isoformat(),
                }
            )

            if len(temas) >= MAX_POR_CATEGORIA:
                return temas

    return temas


def salvar_no_supabase(temas: list[dict]) -> None:
    if not temas:
        print("Nenhum tema encontrado, nada a salvar.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    result = (
        supabase.table("product_trends")
        .upsert(temas, on_conflict="categoria,titulo,data_coleta")
        .execute()
    )
    print(f"{len(result.data)} tendências de produto salvas/atualizadas.")


def main():
    print(f"Buscando tendências de produto — {date.today().isoformat()}")
    todos = []

    for categoria, buscas in CATEGORIAS.items():
        temas = buscar_por_categoria(categoria, buscas)
        print(f"[{categoria}] {len(temas)} temas recentes e únicos encontrados")
        todos.extend(temas)

    salvar_no_supabase(todos)


if __name__ == "__main__":
    main()
