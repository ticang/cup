from __future__ import annotations

from dataclasses import dataclass
from math import exp, factorial


MAX_GOALS = 6


@dataclass(frozen=True)
class TeamStrength:
    name: str
    rating: float


@dataclass(frozen=True)
class PredictionInput:
    fixture_id: str
    home_team: TeamStrength
    away_team: TeamStrength
    neutral_venue: bool


def poisson_probability(lambda_value: float, goals: int) -> float:
    if lambda_value <= 0:
        raise ValueError("lambda_value must be positive")
    if goals < 0:
        raise ValueError("goals must be non-negative")

    return exp(-lambda_value) * (lambda_value**goals) / factorial(goals)


def expected_goals(
    home_rating: float, away_rating: float, neutral_venue: bool
) -> tuple[float, float]:
    rating_delta = home_rating - away_rating + (0 if neutral_venue else 55)
    home_xg = _clamp(1.35 + rating_delta / 520, 0.35, 3.4)
    away_xg = _clamp(1.18 - rating_delta / 620, 0.3, 3.1)
    return home_xg, away_xg


def generate_prediction(input_data: PredictionInput) -> dict:
    home_xg, away_xg = expected_goals(
        input_data.home_team.rating,
        input_data.away_team.rating,
        input_data.neutral_venue,
    )

    raw_scores = []
    for home_goals in range(MAX_GOALS + 1):
        for away_goals in range(MAX_GOALS + 1):
            raw_scores.append(
                {
                    "homeGoals": home_goals,
                    "awayGoals": away_goals,
                    "probability": poisson_probability(home_xg, home_goals)
                    * poisson_probability(away_xg, away_goals),
                }
            )

    total = sum(score["probability"] for score in raw_scores)
    score_probabilities = sorted(
        [
            {**score, "probability": score["probability"] / total}
            for score in raw_scores
        ],
        key=lambda score: score["probability"],
        reverse=True,
    )

    home_win_prob = _sum_scores(
        score_probabilities,
        lambda score: score["homeGoals"] > score["awayGoals"],
    )
    draw_prob = _sum_scores(
        score_probabilities,
        lambda score: score["homeGoals"] == score["awayGoals"],
    )
    away_win_prob = _sum_scores(
        score_probabilities,
        lambda score: score["homeGoals"] < score["awayGoals"],
    )
    over25_prob = _sum_scores(
        score_probabilities,
        lambda score: score["homeGoals"] + score["awayGoals"] > 2.5,
    )
    top_score = score_probabilities[0]
    confidence = max(home_win_prob, draw_prob, away_win_prob)

    return {
        "fixtureId": input_data.fixture_id,
        "predictedHome": top_score["homeGoals"],
        "predictedAway": top_score["awayGoals"],
        "homeWinProb": home_win_prob,
        "drawProb": draw_prob,
        "awayWinProb": away_win_prob,
        "over25Prob": over25_prob,
        "confidence": confidence,
        "scoreProbabilities": score_probabilities[:20],
        "inputSnapshot": {
            "homeTeam": input_data.home_team.__dict__,
            "awayTeam": input_data.away_team.__dict__,
            "neutralVenue": input_data.neutral_venue,
            "homeXg": home_xg,
            "awayXg": away_xg,
            "model": "elo-poisson-baseline",
        },
    }


def _sum_scores(score_probabilities: list[dict], predicate) -> float:
    return sum(
        score["probability"] for score in score_probabilities if predicate(score)
    )


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(value, minimum), maximum)
