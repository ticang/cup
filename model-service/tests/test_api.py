from fastapi.testclient import TestClient

from football_ai.api.app import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_endpoint_returns_normalized_outcomes() -> None:
    response = client.post(
        "/predict",
        json={
            "fixtureId": "fixture-1",
            "homeTeam": {"name": "Argentina", "rating": 1830},
            "awayTeam": {"name": "France", "rating": 1815},
            "neutralVenue": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    total = body["homeWinProb"] + body["drawProb"] + body["awayWinProb"]
    assert total == pytest_approx(1, tolerance=1e-8)
    assert body["fixtureId"] == "fixture-1"
    assert body["scoreProbabilities"]


def pytest_approx(value: float, tolerance: float = 1e-4):
    import pytest

    return pytest.approx(value, abs=tolerance)
