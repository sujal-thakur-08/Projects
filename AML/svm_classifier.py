from __future__ import annotations

from sklearn.datasets import load_breast_cancer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


def train_kernel_model(kernel, x_train, x_test, y_train, y_test):
    model = Pipeline([("scaler", StandardScaler()), ("svm", SVC(kernel=kernel, C=1.0, gamma="scale"))])

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    return kernel, accuracy_score(y_test, predictions), confusion_matrix(y_test, predictions), classification_report(
        y_test, predictions, target_names=["malignant", "benign"]
    )


def main() -> None:
    data = load_breast_cancer()
    x_train, x_test, y_train, y_test = train_test_split(
        data.data,
        data.target,
        test_size=0.2,
        random_state=42,
        stratify=data.target,
    )

    kernels = ["linear", "rbf"]
    results = [train_kernel_model(kernel, x_train, x_test, y_train, y_test) for kernel in kernels]

    print("SVM classifier on the Breast Cancer Wisconsin dataset")
    print("=" * 55)
    for kernel, accuracy, matrix, report in results:
        print(f"Kernel: {kernel}")
        print(f"Accuracy: {accuracy:.4f}")
        print("Confusion matrix:")
        for row in matrix:
            print(f"  {row.tolist()}")
        print("Classification report:")
        print(report)
        print("-" * 55)

    best_kernel, best_accuracy, _, _ = max(results, key=lambda item: item[1])
    print(f"Best kernel by accuracy: {best_kernel} ({best_accuracy:.4f})")


if __name__ == "__main__":
    main()
