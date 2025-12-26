
const FOOTBALL_API_KEY = "359b13acb3f5e191c7278d0c64a24372";
const FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

const TMDB_API_KEY = "5583f1d2e203b4ebad36c6cc5d4317bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const getFootballGames = async () => {
  // Obtém a data atual no formato YYYY-MM-DD usando o fuso de São Paulo
  const spDate = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const response = await fetch(`${FOOTBALL_BASE_URL}/fixtures?date=${spDate}&timezone=America/Sao_Paulo`, {
    method: "GET",
    headers: {
      "x-apisports-key": FOOTBALL_API_KEY
    }
  });
  
  if (!response.ok) throw new Error("Falha na comunicação com a API de Futebol");
  
  const data = await response.json();
  return data.response || [];
};

export const getOdds = async (fixtureId: number) => {
  try {
    const res = await fetch(`${FOOTBALL_BASE_URL}/odds?fixture=${fixtureId}`, {
      method: "GET",
      headers: { 
        "x-apisports-key": FOOTBALL_API_KEY 
      }
    });
    const data = await res.json();
    const values = data.response?.[0]?.bookmakers?.[0]?.bets?.[0]?.values;
    if (values && values.length >= 3) {
      return `${values[0].odd} | ${values[1].odd} | ${values[2].odd}`;
    }
    return "1.80 | 3.40 | 2.10"; // Odds padrão caso não existam dados
  } catch {
    return "CONSULTE AS ODDS";
  }
};

export const searchMovies = async (query: string) => {
  const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
  const data = await response.json();
  return data.results || [];
};

export const searchSeries = async (query: string) => {
  const response = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
  const data = await response.json();
  return data.results || [];
};
