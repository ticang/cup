def brier_score(probabilities: list[float], actual_index: int) -> float:
    if not probabilities:
        raise ValueError("probabilities must not be empty")
    if actual_index < 0 or actual_index >= len(probabilities):
        raise ValueError("actual_index is out of range")

    total_probability = sum(probabilities)
    if abs(total_probability - 1.0) > 1e-6:
        raise ValueError("probabilities must sum to 1")

    return sum(
        (probability - (1.0 if index == actual_index else 0.0)) ** 2
        for index, probability in enumerate(probabilities)
    )
