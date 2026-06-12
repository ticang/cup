from football_ai.backtest.metrics import brier_score
from football_ai.models.baseline import (
    PredictionInput,
    TeamStrength,
    expected_goals,
    generate_prediction,
    poisson_probability,
)


def test_poisson_probability_for_exact_score() -> None:
    assert poisson_probability(1.4, 0) == pytest_approx(0.2466)
    assert poisson_probability(1.4, 2) == pytest_approx(0.2417)


def test_generated_prediction_outcomes_sum_to_one() -> None:
    prediction = generate_prediction(
        PredictionInput(
            fixture_id="fixture-1",
            home_team=TeamStrength(name="Home", rating=1700),
            away_team=TeamStrength(name="Away", rating=1650),
            neutral_venue=True,
        )
    )

    total = (
        prediction["homeWinProb"]
        + prediction["drawProb"]
        + prediction["awayWinProb"]
    )

    assert total == pytest_approx(1, tolerance=1e-8)
    assert prediction["scoreProbabilities"][0]["probability"] > 0


def test_expected_goals_are_bounded() -> None:
    high_home_xg, _ = expected_goals(2400, 900, False)
    low_home_xg, _ = expected_goals(900, 2400, True)

    assert high_home_xg <= 3.4
    assert low_home_xg >= 0.35


def test_brier_score_validates_probability_distribution() -> None:
    assert brier_score([0.5, 0.25, 0.25], 0) == pytest_approx(0.375)


def pytest_approx(value: float, tolerance: float = 1e-4):
    import pytest

    return pytest.approx(value, abs=tolerance)
