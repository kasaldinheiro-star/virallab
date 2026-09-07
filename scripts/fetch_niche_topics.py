"""
Busca notícias/temas recentes por nicho fixo (Analog Horror, GTA, Entretenimento)
usando o Google News RSS (público, gratuito, estável — diferente do Trends).
Gera ideias de vídeo por template (sem IA) e salva no Supabase.

Rodar manualmente:
    python scripts/fetch_niche_topics.py
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

MAX_TEMAS_POR_NICHO = 8

# Consulta de busca no Google News por nicho + templates de ideia específicos
NICHOS = {
    "analog_horror": {
        "query": '"analog horror" OR "terror analógico"',
        "templates": [
            "Terror analógico: recriando o estilo de {tema}",
            "Analisando o found footage de {tema}",
            "Se {tema} fosse um Analog Horror",
        ],
    },
    "gta": {
        "query": '"GTA 6" OR "GTA VI" OR "Grand Theft Auto 6"',
        "templates": [
            "Tudo que sabemos sobre {tema}",
            "Reagindo às novidades de {tema}",
            "{tema}: vale a pena esperar?",
        ],
    },
    "entretenimento": {
        "query": '"entretenimento viral" OR "tendência entretenimento"',
        "templates": [
            "Minha opinião sobre {tema}",
            "Reagindo a {tema}",
            "{tema} em 30 segundos",
        ],
    },
}


def gerar_ideias(tema: str, templates: list[str]) -> str:
    """Gera ideias de vídeo por template específico do nicho, sem IA."""
    ideias = [t.format(tema=tema) for t in templates]
    return "\n".join(f"- {ideia}" for ideia in ideias)


def buscar_temas_nicho(nicho: str, query: str, templates: list[str]) -> list[dict]:
    """Usa o Google News RSS (público) para buscar manchetes recentes sobre o nicho."""
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl=pt-BR&gl=BR&ceid=BR:pt"
    temas = []

    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"[{nicho}] Erro ao buscar Google News RSS: {e}")
        return []

    items = root.findall(".//item")[:MAX_TEMAS_POR_NICHO]

    for i, item in enumerate(items):
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not titulo:
            continue

        score = MAX_TEMAS_POR_NICHO - i  # mais recente = maior score

        temas.append(
            {
                "nicho": nicho,
                "titulo": titulo,
                "fonte_url": link,
                "score": score,
                "data_coleta": date.today().isoformat(),
                "ideias_video": gerar_ideias(titulo, templates),
            }
        )

    return temas


def salvar_no_supabase(temas: list[dict]) -> None:
    if not temas:
        print("Nenhum tema encontrado, nada a salvar.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    result = (
        supabase.table("niche_topics")
        .upsert(temas, on_conflict="nicho,titulo,data_coleta")
        .execute()
    )
    print(f"{len(result.data)} temas de nicho salvos/atualizados.")


def main():
    print(f"Buscando temas por nicho — {date.today().isoformat()}")
    todos_temas = []

    for nicho, config in NICHOS.items():
        temas = buscar_temas_nicho(nicho, config["query"], config["templates"])
        print(f"[{nicho}] {len(temas)} temas encontrados")
        todos_temas.extend(temas)

    salvar_no_supabase(todos_temas)


if __name__ == "__main__":
    main()
