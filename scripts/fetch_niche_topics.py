"""
Busca notícias/temas recentes por nicho fixo (Analog Horror, GTA, Entretenimento)
usando o Google News RSS (público, gratuito). Filtra por data de publicação
real, descartando notícias com mais de 30 dias — o Google News retorna por
relevância, não por data, então esse filtro é obrigatório para evitar
notícias antigas.

Rodar manualmente:
    python scripts/fetch_niche_topics.py
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

MAX_TEMAS_POR_NICHO = 8
MAX_DIAS_ANTIGUIDADE = 30  # descarta notícias mais antigas que isso

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
    ideias = [t.format(tema=tema) for t in templates]
    return "\n".join(f"- {ideia}" for ideia in ideias)


def idade_em_dias(pub_date_str: str | None) -> int | None:
    """Converte o campo pubDate do RSS em número de dias desde hoje."""
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


def buscar_temas_nicho(nicho: str, query: str, templates: list[str]) -> list[dict]:
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl=pt-BR&gl=BR&ceid=BR:pt"
    temas = []

    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"[{nicho}] Erro ao buscar Google News RSS: {e}")
        return []

    items = root.findall(".//item")  # pega todos, filtra por data depois

    for item in items:
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = item.findtext("pubDate")

        if not titulo:
            continue

        dias = idade_em_dias(pub_date)
        if dias is None or dias > MAX_DIAS_ANTIGUIDADE:
            continue  # descarta notícia sem data ou antiga demais

        score = max(MAX_TEMAS_POR_NICHO - dias, 1)  # mais recente = maior score

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

        if len(temas) >= MAX_TEMAS_POR_NICHO:
            break

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
        print(f"[{nicho}] {len(temas)} temas recentes encontrados")
        todos_temas.extend(temas)

    salvar_no_supabase(todos_temas)


if __name__ == "__main__":
    main()
