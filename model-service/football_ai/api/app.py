from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field

from football_ai.models.baseline import (
    PredictionInput,
    TeamStrength,
    generate_prediction,
)


app = FastAPI(
    title="Football AI Model Service",
    version="0.1.0",
    description="Prediction and evaluation service for football matches.",
)


class TeamPayload(BaseModel):
    name: str = Field(min_length=1)
    rating: float = Field(gt=0)


class PredictionPayload(BaseModel):
    fixtureId: str = Field(min_length=1)
    homeTeam: TeamPayload
    awayTeam: TeamPayload
    neutralVenue: bool = True


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(payload: PredictionPayload) -> dict:
    prediction = generate_prediction(
        PredictionInput(
            fixture_id=payload.fixtureId,
            home_team=TeamStrength(
                name=payload.homeTeam.name,
                rating=payload.homeTeam.rating,
            ),
            away_team=TeamStrength(
                name=payload.awayTeam.name,
                rating=payload.awayTeam.rating,
            ),
            neutral_venue=payload.neutralVenue,
        )
    )
    return prediction
