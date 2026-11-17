import { Service } from '../../providers/service/service';
/**
 * A generator class for Fibonacci sequence numbers.
 */
export declare class FibonacciGenerator implements Service {
    /** Current first number in the sequence calculation */
    private fibo1;
    /** Current second number in the sequence calculation */
    private fibo2;
    /**
     * Generates the next Fibonacci number in the sequence.
     * Each call advances the sequence by one position.
     *
     * @returns The next number in the Fibonacci sequence
     */
    next(): number;
    /**
     * Resets the generator to its initial state.
     * After calling this method, the next call to next() will return 1.
     */
    reset: () => void;
}
