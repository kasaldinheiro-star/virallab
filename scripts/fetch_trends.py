"""
Busca os temas em alta da semana no Google Trends (Brasil) usando o feed RSS
público oficial (sem biblioteca instável, sem chave de API) e salva no
Supabase, junto com ideias de vídeo geradas por template (sem IA).

Rodar manualmente:
    python scripts/fetch_trends.py
"""

import os
import re
import sys
from datetime import date
import xml.etree.ElementTree as ET

import requests
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.")
    sys.exit(1)

REGIAO = "BR"
MAX_TEMAS = 15
RSS_URL = f"https://trends.google.com/trends/trendingsearches/daily/rss?geo={REGIAO}"
NAMESPACE = {"ht": "https://trends.google.com/trends/trendingsearches/daily"}

TEMPLATES_IDEIA = [
    "Reagindo a {tema}",
    "3 coisas que você não sabia sobre {tema}",
    "Minha opinião sincera sobre {tema}",
    "O que ninguém está te contando sobre {tema}",
    "{tema} explicado em 30 segundos",
]


def gerar_ideias(tema: str, quantidade: int = 3) -> str:
    """Gera de 2 a 3 ideias de vídeo por template, sem usar IA."""
    ideias = [t.format(tema=tema) for t in TEMPLATES_IDEIA[:quantidade]]
    return "\n".join(f"- {ideia}" for ideia in ideias)


def parse_traffic(text: str | None) -> int:
    """Converte algo como '20.000+ buscas' em um número (20000)."""
    if not text:
        return 50
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else 50


def buscar_temas_google_trends() -> list[dict]:
    """
    Usa o feed RSS público e oficial de tendências diárias do Google Trends.
    Não requer chave de API nem biblioteca não-oficial.
    """
    temas = []
    try:
        resp = requests.get(RSS_URL, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"Erro ao buscar RSS do Google Trends: {e}")
        return []

    items = root.findall(".//item")[:MAX_TEMAS]

    for item in items:
        titulo = (item.findtext("title") or "").strip()
        if not titulo:
            continue

        traffic_el = item.find("ht:approx_traffic", NAMESPACE)
        score = parse_traffic(traffic_el.text if traffic_el is not None else None)

        temas.append(
            {
                "tema": titulo,
                "categoria": None,
                "regiao": REGIAO,
                "score": score,
                "data_coleta": date.today().isoformat(),
                "ideias_video": gerar_ideias(titulo),
            }
        )

    return temas


def salvar_no_supabase(temas: list[dict]) -> None:
    if not temas:
        print("Nenhum tema encontrado, nada a salvar.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    result = (
        supabase.table("trending_topics")
        .upsert(temas, on_conflict="tema,data_coleta,regiao")
        .execute()
    )
    print(f"{len(result.data)} temas salvos/atualizados na tabela trending_topics.")


def main():
    print(f"Buscando temas em alta ({REGIAO}) — {date.today().isoformat()}")
    temas = buscar_temas_google_trends()
    salvar_no_supabase(temas)


if __name__ == "__main__":
    main()
