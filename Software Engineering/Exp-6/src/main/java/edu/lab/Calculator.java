package edu.lab;

public class Calculator {

    public int add(int a, int b) {
        return a + b;
    }

    public boolean isEven(int number) {
        return number % 2 == 0;
    }

    public boolean isPositive(int number) {
        return number > 0;
    }

    public Integer safeDivide(int numerator, int denominator) {
        if (denominator == 0) {
            return null;
        }
        return numerator / denominator;
    }

    public String getName() {
        return "Simple Calculator";
    }
}
