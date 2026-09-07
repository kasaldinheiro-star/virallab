"""
Busca os temas em alta da semana no Google Trends (Brasil) usando pytrends
(biblioteca gratuita, não oficial) e salva no Supabase, junto com ideias de
vídeo geradas por template (sem IA, apenas substituição de texto).

Rodar manualmente:
    python scripts/fetch_trends.py

Rodar via GitHub Actions:
    ver .github/workflows/weekly-trends.yml
"""

import os
import sys
import time
from datetime import date

from pytrends.request import TrendReq
from supabase import create_client

# --- Configuração ---------------------------------------------------------

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Erro: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.")
    sys.exit(1)

REGIAO = "BR"
MAX_TEMAS = 15

# Templates de ideias de vídeo — substituição simples de texto, sem IA
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


def buscar_temas_google_trends() -> list[dict]:
    """
    Usa pytrends para buscar as buscas em alta do dia no Brasil.
    pytrends não é uma API oficial do Google — pode ter instabilidade
    ocasional, mas é gratuita e suficiente para uma coleta semanal.
    """
    pytrends = TrendReq(hl="pt-BR", tz=180)
    temas = []

    try:
        trending = pytrends.trending_searches(pn="brazil")
        lista_temas = trending[0].tolist()[:MAX_TEMAS]
    except Exception as e:
        print(f"Erro ao buscar trending_searches: {e}")
        return []

    # Para cada tema, tenta pegar um score relativo de interesse (0-100)
    for i, tema in enumerate(lista_temas):
        score = 100 - (i * (100 // max(MAX_TEMAS, 1)))  # score decrescente por posição
        try:
            pytrends.build_payload([tema], timeframe="now 1-d", geo=REGIAO)
            interest = pytrends.interest_over_time()
            if not interest.empty:
                score = int(interest[tema].mean())
        except Exception:
            # Se falhar o interesse detalhado, mantém o score por posição
            pass

        temas.append(
            {
                "tema": tema,
                "categoria": None,  # pode ser preenchido manualmente depois no admin
                "regiao": REGIAO,
                "score": score,
                "data_coleta": date.today().isoformat(),
                "ideias_video": gerar_ideias(tema),
            }
        )
        time.sleep(1)  # evita rate limit do pytrends

    return temas


def salvar_no_supabase(temas: list[dict]) -> None:
    if not temas:
        print("Nenhum tema encontrado, nada a salvar.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # upsert evita duplicar o mesmo tema na mesma data (ver unique index no schema)
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
