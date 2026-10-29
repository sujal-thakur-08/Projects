package edu.lab;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalculatorTest {

    private Calculator calculator;

    @BeforeAll
    static void setUpBeforeClass() {
        System.out.println("Starting Calculator test suite");
    }

    @AfterAll
    static void tearDownAfterClass() {
        System.out.println("Finished Calculator test suite");
    }

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @AfterEach
    void tearDown() {
        calculator = null;
    }

    @Test
    void testAdd_TC01() {
        int a = 10;
        int b = 20;
        int expected = 30;

        int actual = calculator.add(a, b);
        assertEquals(expected, actual, "Addition result should match expected value");
    }

    @Test
    void testIsEven_UsesAssertTrue() {
        assertTrue(calculator.isEven(8), "8 should be even");
    }

    @Test
    void testIsPositive_UsesAssertFalse() {
        assertFalse(calculator.isPositive(-4), "-4 should not be positive");
    }

    @Test
    void testSafeDivide_UsesAssertNull() {
        Integer result = calculator.safeDivide(10, 0);
        assertNull(result, "Division by zero should return null");
    }

    @Test
    void testGetName_UsesAssertNotNull() {
        String name = calculator.getName();
        assertNotNull(name, "Calculator name should not be null");
    }
}
