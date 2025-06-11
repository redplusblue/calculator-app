// components/Calculator.tsx
// This component contains the core logic and UI for the calculator.

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';

// Define the type for the calculator state to ensure type safety.
interface CalculatorState {
    displayValue: string; // The value currently shown on the display
    operator: string | null; // The selected operator (+, -, *, /)
    firstOperand: number | null; // The first number in the operation
    waitingForSecondOperand: boolean; // Flag to indicate if we're waiting for the second number
    activeOperator: string | null; // New state to track the actively selected operator for styling
}

// Functional component for a single calculator button.
interface CalculatorButtonProps {
    text: string;
    onPress: (value: string) => void;
    buttonStyle?: object; // Optional custom style for the button
    textStyle?: object; // Optional custom style for the button text
    size: number; // Required size for the button (width and height)
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({
    text,
    onPress,
    buttonStyle,
    textStyle,
    size, // Destructure size prop
}) => (
    <TouchableOpacity
        // Apply dynamic size to the button style
        style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, buttonStyle]}
        onPress={() => onPress(text)}
    >
        <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
);

/**
 * The main Calculator component.
 * It manages the calculator's state, handles user input, and renders the UI.
 */
const Calculator: React.FC = () => {
    // State for the calculator's operation
    const [calcState, setCalcState] = useState<CalculatorState>({
        displayValue: '0',
        operator: null,
        firstOperand: null,
        waitingForSecondOperand: false,
        activeOperator: null,
    });

    // State to track screen dimensions for responsive layout.
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    // Effect hook to update dimensions on screen orientation changes.
    useEffect(() => {
        const onChange = ({ window }: { window: { width: number; height: number } }) => {
            setDimensions(window);
        };
        const subscription = Dimensions.addEventListener('change', onChange);
        return () => subscription.remove();
    }, []);

    // Determine if the device is in landscape mode.
    const isLandscape = dimensions.width > dimensions.height;

    // Calculate button size dynamically using useMemo for optimization.
    // This calculation accounts for container padding and button spacing.
    const buttonSize = useMemo(() => {
        const availableHeight = dimensions.height * 0.6; // Allocate 60% of screen height for buttons
        const rows = 5; // Number of button rows
        const totalVerticalPadding = 10 * 2; // Vertical padding of buttonsContainer
        const totalRowSpacing = 10 * (rows - 1); // Spacing between rows

        // Use MAX_CALC_WIDTH for width-based calculation
        const sizeByWidth = (MAX_CALC_WIDTH - BUTTON_CONTAINER_PADDING - BUTTON_MARGIN * 2 * BUTTONS_PER_ROW) / BUTTONS_PER_ROW;
        const sizeByHeight = (availableHeight - totalVerticalPadding - totalRowSpacing) / rows;

        // Use the smaller size to ensure buttons fit within the screen
        return Math.min(sizeByWidth, sizeByHeight);
    }, [dimensions]);

    // Calculate the width for the "0" button (spans two buttons + spacing)
    const zeroButtonWidth = buttonSize * 2 + BUTTON_MARGIN * 2;

    /**
     * Handles digit presses (0-9).
     * Appends the digit to the current display value or starts a new number.
     * @param digit The digit pressed.
     */
    const handleDigit = (digit: string) => {
        setCalcState(prevState => {
            return {
                ...prevState,
                displayValue:
                    prevState.waitingForSecondOperand || prevState.displayValue === '0'
                        ? digit
                        : prevState.displayValue + digit,
                waitingForSecondOperand: false,
                activeOperator: null, // Clear active operator when a digit is pressed
            };
        });
    };

    /**
     * Handles operator presses (+, -, *, /).
     * Stores the first operand and the operator, and prepares for the second operand.
     * If an operator is pressed consecutively, it updates the operator after performing
     * the previous operation.
     * @param nextOperator The operator pressed.
     */
    const handleOperator = (nextOperator: string) => {
        setCalcState(prevState => {
            const inputValue = parseFloat(prevState.displayValue);

            if (prevState.activeOperator === nextOperator && prevState.waitingForSecondOperand) {
                return prevState;
            }

            if (prevState.firstOperand === null) {
                return {
                    ...prevState,
                    firstOperand: inputValue,
                    operator: nextOperator,
                    waitingForSecondOperand: true,
                    activeOperator: nextOperator,
                };
            } else if (prevState.operator) {
                const result = performOperation(
                    prevState.operator,
                    prevState.firstOperand,
                    inputValue,
                );

                if (!Number.isFinite(result)) {
                    return {
                        displayValue: "Error",
                        operator: null,
                        firstOperand: null,
                        waitingForSecondOperand: false,
                        activeOperator: null,
                    };
                }

                return {
                    ...prevState,
                    displayValue: String(result),
                    firstOperand: result,
                    operator: nextOperator,
                    waitingForSecondOperand: true,
                    activeOperator: nextOperator,
                };
            }
            return prevState;
        });
    };

    /**
     * Handles the decimal point press.
     * Adds a decimal point if one doesn't already exist in the display value.
     */
    const handleDecimal = () => {
        setCalcState(prevState => {
            if (prevState.waitingForSecondOperand) {
                return {
                    ...prevState,
                    displayValue: '0.',
                    waitingForSecondOperand: false,
                    activeOperator: null,
                };
            } else if (!prevState.displayValue.includes('.')) {
                return {
                    ...prevState,
                    displayValue: prevState.displayValue + '.',
                    activeOperator: null,
                };
            }
            return prevState;
        });
    };

    /**
     * Clears the calculator state, resetting it to its initial values.
     */
    const handleClear = () => {
        setCalcState({
            displayValue: '0',
            operator: null,
            firstOperand: null,
            waitingForSecondOperand: false,
            activeOperator: null,
        });
    };

    /**
     * Handles the equals button press.
     * Performs the calculation using the stored first operand, operator, and current display value.
     */
    const handleEquals = () => {
        setCalcState(prevState => {
            if (prevState.firstOperand === null || prevState.operator === null) {
                return { ...prevState, activeOperator: null };
            }

            const secondOperand = parseFloat(prevState.displayValue);
            const result = performOperation(
                prevState.operator,
                prevState.firstOperand,
                secondOperand,
            );

            if (!Number.isFinite(result)) {
                return {
                    displayValue: "Error",
                    operator: null,
                    firstOperand: null,
                    waitingForSecondOperand: false,
                    activeOperator: null,
                };
            }

            return {
                displayValue: String(result),
                operator: null,
                firstOperand: null,
                waitingForSecondOperand: false,
                activeOperator: null,
            };
        });
    };

    /**
     * Performs the actual arithmetic operation based on the operator.
     * @param operator The operator symbol (+, -, *, /).
     * @param operand1 The first number.
     * @param operand2 The second number.
     * @returns The result of the operation.
     */
    const performOperation = (
        operator: string,
        operand1: number,
        operand2: number,
    ): number => {
        switch (operator) {
            case '+':
                return operand1 + operand2;
            case '-':
                return operand1 - operand2;
            case '*':
                return operand1 * operand2;
            case '/':
                if (operand2 === 0) {
                    return Infinity;
                }
                return operand1 / operand2;
            default:
                return operand2;
        }
    };

    // Helper function to get operator button styles based on active operator
    const getOperatorButtonStyles = (op: string) => {
        const isActive = calcState.activeOperator === op;
        return [
            styles.operatorButton,
            isActive && styles.operatorButtonActive,
        ];
    };

    // Helper function to get operator button text styles based on active operator
    const getOperatorButtonTextStyles = (op: string) => {
        const isActive = calcState.activeOperator === op;
        return [
            styles.operatorButtonText,
            isActive && styles.operatorButtonTextActive,
        ];
    };

    // Render the calculator UI
    return (
        <View style={styles.container}>
            <View style={styles.calculatorContent}>
                {/* Display area */}
                <View style={styles.displayContainer}>
                    <Text
                        style={styles.displayText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        {calcState.displayValue}
                    </Text>
                </View>
                {/* Buttons layout - adapts based on orientation */}
                <View style={[
                    styles.buttonsContainer,
                    isLandscape ? styles.buttonsLandscape : styles.buttonsPortrait,
                ]}>
                    {/* Row 1: Clear, Toggle Sign, Percentage, Divide */}
                    <View style={styles.buttonRow}>
                        <CalculatorButton
                            text="AC"
                            onPress={handleClear}
                            buttonStyle={styles.functionButton}
                            textStyle={styles.functionButtonText}
                            size={buttonSize}
                        />
                        <CalculatorButton
                            text="+/-"
                            onPress={() => {
                                setCalcState(prevState => ({
                                    ...prevState,
                                    displayValue: String(parseFloat(prevState.displayValue) * -1),
                                }));
                            }}
                            buttonStyle={styles.functionButton}
                            textStyle={styles.functionButtonText}
                            size={buttonSize}
                        />
                        <CalculatorButton
                            text="%"
                            onPress={() => {
                                setCalcState(prevState => ({
                                    ...prevState,
                                    displayValue: String(parseFloat(prevState.displayValue) / 100),
                                }));
                            }}
                            buttonStyle={styles.functionButton}
                            textStyle={styles.functionButtonText}
                            size={buttonSize}
                        />
                        <CalculatorButton
                            text="/"
                            onPress={handleOperator}
                            buttonStyle={getOperatorButtonStyles('/')}
                            textStyle={getOperatorButtonTextStyles('/')}
                            size={buttonSize}
                        />
                    </View>

                    {/* Row 2: 7, 8, 9, Multiply */}
                    <View style={styles.buttonRow}>
                        <CalculatorButton text="7" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="8" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="9" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton
                            text="*"
                            onPress={handleOperator}
                            buttonStyle={getOperatorButtonStyles('*')}
                            textStyle={getOperatorButtonTextStyles('*')}
                            size={buttonSize}
                        />
                    </View>

                    {/* Row 3: 4, 5, 6, Subtract */}
                    <View style={styles.buttonRow}>
                        <CalculatorButton text="4" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="5" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="6" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton
                            text="-"
                            onPress={handleOperator}
                            buttonStyle={getOperatorButtonStyles('-')}
                            textStyle={getOperatorButtonTextStyles('-')}
                            size={buttonSize}
                        />
                    </View>

                    {/* Row 4: 1, 2, 3, Add */}
                    <View style={styles.buttonRow}>
                        <CalculatorButton text="1" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="2" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton text="3" onPress={handleDigit} size={buttonSize} />
                        <CalculatorButton
                            text="+"
                            onPress={handleOperator}
                            buttonStyle={getOperatorButtonStyles('+')}
                            textStyle={getOperatorButtonTextStyles('+')}
                            size={buttonSize}
                        />
                    </View>

                    {/* Row 5: 0, Decimal, Equals */}
                    <View style={styles.buttonRow}>
                        <CalculatorButton
                            text="0"
                            onPress={handleDigit}
                            buttonStyle={[styles.button, { width: zeroButtonWidth, borderRadius: buttonSize }]}
                            textStyle={styles.buttonText}
                            size={buttonSize} // Pass buttonSize even if width is overridden for consistency
                        />
                        <CalculatorButton text="." onPress={handleDecimal} size={buttonSize} />
                        <CalculatorButton
                            text="="
                            onPress={handleEquals}
                            buttonStyle={styles.operatorButton}
                            textStyle={styles.operatorButtonText}
                            size={buttonSize}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

const MAX_CALC_WIDTH = 370;
const BUTTON_MARGIN = 2;
const BUTTONS_PER_ROW = 4;
const BUTTON_CONTAINER_PADDING = 10 * 2; // 10 left + 10 right

// Stylesheet for the Calculator component, designed to mimic iOS calculator.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        ...(Platform.OS === 'web' && {
            height: '100%',
            justifyContent: 'center',
        }),
    },
    calculatorContent: {
        width: '100%',
        maxWidth: MAX_CALC_WIDTH,
        flex: 1,
        justifyContent: 'flex-end',
    },
    displayContainer: {
        height: 100, // Classic calculator display height
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingBottom: 10,
        width: '100%',
        maxWidth: MAX_CALC_WIDTH,
        alignSelf: 'center',
        // REMOVE flex: 0
    },
    displayText: {
        color: 'white',
        fontSize: 64, // Classic calculator font size
        fontWeight: '300',
        fontFamily: Platform.select({
            ios: 'Helvetica Neue',
            android: 'Roboto',
            default: 'Arial',
        }),
        width: '100%',
        maxWidth: MAX_CALC_WIDTH,
        textAlign: 'right',
    },
    buttonsContainer: {
        flex: 1,
        paddingHorizontal: 10,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        justifyContent: 'flex-end',
        width: '100%',
        maxWidth: MAX_CALC_WIDTH,
        alignSelf: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10, // Classic vertical spacing
    },
    button: {
        borderRadius: 999,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4, // Classic horizontal spacing
        // REMOVE margin: 2
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 38,
        fontWeight: '400',
        fontFamily: Platform.select({
            ios: 'Helvetica Neue',
            android: 'Roboto',
            default: 'Arial',
        }),
    },
    functionButton: {
        backgroundColor: '#A5A5A5',
    },
    functionButtonText: {
        color: 'black',
    },
    operatorButton: {
        backgroundColor: '#FF9500',
    },
    operatorButtonText: {
        color: 'white',
    },
    operatorButtonActive: {
        backgroundColor: 'white',
    },
    operatorButtonTextActive: {
        color: '#FF9500',
    },
});

export default Calculator;
