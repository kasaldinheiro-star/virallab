"""
Busca notícias/tendências de produtos por categoria fixa usando Google News
RSS. Filtra por data de publicação real (máximo 30 dias), já que o Google
News retorna por relevância, não por recência.

Rodar manualmente:
    python scripts/fetch_product_trends.py
"""

import os
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

MAX_POR_CATEGORIA = 8
MAX_DIAS_ANTIGUIDADE = 30

CATEGORIAS = {
    "tecnologia": '"lançamento de celular 2026" OR "novo gadget lançado" OR "smartphone lançamento Brasil"',
    "casa": '"achadinhos para casa" OR "produtos para casa em alta" OR "organização da casa tendência"',
    "cama_banho": '"cama e banho tendência" OR "enxoval em alta" OR "produtos para o quarto"',
    "fitness": '"equipamento fitness tendência" OR "produtos para corrida" OR "acessório academia lançamento"',
    "dia_a_dia": '"produtos virais" OR "achadinhos do dia a dia" OR "utensílios em alta"',
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


def buscar_por_categoria(categoria: str, query: str) -> list[dict]:
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl=pt-BR&gl=BR&ceid=BR:pt"
    temas = []

    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"[{categoria}] Erro ao buscar Google News RSS: {e}")
        return []

    items = root.findall(".//item")

    for item in items:
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = item.findtext("pubDate")

        if not titulo:
            continue

        dias = idade_em_dias(pub_date)
        if dias is None or dias > MAX_DIAS_ANTIGUIDADE:
            continue

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
            break

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

    for categoria, query in CATEGORIAS.items():
        temas = buscar_por_categoria(categoria, query)
        print(f"[{categoria}] {len(temas)} temas recentes encontrados")
        todos.extend(temas)

    salvar_no_supabase(todos)


if __name__ == "__main__":
    main()
