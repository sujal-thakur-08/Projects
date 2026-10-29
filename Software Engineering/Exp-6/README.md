# Experiment 6 - Unit Testing on Small Programs Using JUnit

## Experiment Title
Perform Unit Testing on Small Programs Using JUnit

## Aim
To understand and perform unit testing on small Java programs using the JUnit testing framework in order to verify the correctness of individual program units.

## Objective
- Understand the concept of unit testing.
- Learn the basics of the JUnit framework.
- Write and execute test cases using JUnit.
- Validate expected and actual outputs.
- Analyze test results.

## Software Requirements
- Java Development Kit (JDK 17 or above)
- JUnit framework (JUnit 5)
- Any Java IDE such as Eclipse, IntelliJ IDEA, or NetBeans

## Hardware Requirements
- Computer system with minimum 4 GB RAM

## Theory
Unit testing is a software testing technique in which individual units or components of a software application are tested independently. A unit refers to the smallest testable part of a program such as a method or function. Unit testing is usually performed by developers during the coding phase to detect errors early. JUnit is a widely used open-source testing framework for Java that supports writing and running automated test cases.

This project uses JUnit 5 lifecycle annotations:
- `@Test`
- `@BeforeEach` (equivalent to JUnit 4 `@Before`)
- `@AfterEach` (equivalent to JUnit 4 `@After`)
- `@BeforeAll` (equivalent to JUnit 4 `@BeforeClass`)
- `@AfterAll` (equivalent to JUnit 4 `@AfterClass`)

Assertions used in this project:
- `assertEquals`
- `assertTrue`
- `assertFalse`
- `assertNull`
- `assertNotNull`

## Algorithm
1. Write a simple Java class with one or more methods.
2. Create a JUnit test class.
3. Import JUnit libraries.
4. Write test methods using `@Test`.
5. Use assertion methods to verify results.
6. Run the test cases.
7. Analyze the test results.

## Program Under Test
Class name: `Calculator`

Methods:
- `add(int a, int b)`
- `isEven(int number)`
- `isPositive(int number)`
- `safeDivide(int numerator, int denominator)`
- `getName()`

## Test Case Example
- Test Case ID: TC01
- Input: a = 10, b = 20
- Expected Output: 30

## Procedure
1. Open the project in your Java IDE.
2. Ensure Maven dependencies are downloaded.
3. Open `src/main/java/edu/lab/Calculator.java`.
4. Open `src/test/java/edu/lab/CalculatorTest.java`.
5. Run all tests from IDE or with Maven.
6. Observe passed/failed test results.

## How to Run (Terminal)
From the project root, run:

```powershell
mvn test
```

## Expected Result
All tests should pass, demonstrating successful unit testing of individual methods using JUnit.
