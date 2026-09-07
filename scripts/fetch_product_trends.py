"""
Busca notícias/tendências de produtos por categoria fixa (Tecnologia, Casa,
Cama e Banho, Fitness, Dia a Dia) usando o Google News RSS (público, gratuito).

Importante: isso busca BUZZ e lançamentos comentados na mídia, não o ranking
oficial de vendas das lojas (esse dado é fechado a cada plataforma).

Rodar manualmente:
    python scripts/fetch_product_trends.py
"""

import os
import sys
from datetime import date
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

CATEGORIAS = {
    "tecnologia": '"lançamento tecnologia" OR "gadget em alta" OR "melhor smartphone 2026"',
    "casa": '"achadinhos para casa" OR "produtos para casa em alta" OR "organização da casa tendência"',
    "cama_banho": '"cama e banho tendência" OR "enxoval em alta" OR "produtos para o quarto"',
    "fitness": '"equipamento fitness tendência" OR "produtos para corrida" OR "acessório academia lançamento"',
    "dia_a_dia": '"produtos virais" OR "achadinhos do dia a dia" OR "utensílios em alta"',
}


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

    items = root.findall(".//item")[:MAX_POR_CATEGORIA]

    for i, item in enumerate(items):
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not titulo:
            continue

        temas.append(
            {
                "categoria": categoria,
                "titulo": titulo,
                "fonte_url": link,
                "score": MAX_POR_CATEGORIA - i,
                "data_coleta": date.today().isoformat(),
            }
        )

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
        print(f"[{categoria}] {len(temas)} temas encontrados")
        todos.extend(temas)

    salvar_no_supabase(todos)


if __name__ == "__main__":
    main()
