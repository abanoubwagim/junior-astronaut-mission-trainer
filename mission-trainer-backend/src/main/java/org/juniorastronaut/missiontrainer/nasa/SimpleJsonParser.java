package org.juniorastronaut.missiontrainer.nasa;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Small dependency-free JSON parser for the read-only bundled evidence files. */
final class SimpleJsonParser {
    private final String input;
    private int index;

    private SimpleJsonParser(String input) {
        this.input = input;
    }

    static Object parse(String input) {
        SimpleJsonParser parser = new SimpleJsonParser(input);
        Object value = parser.value();
        parser.whitespace();
        if (parser.index != parser.input.length()) throw parser.error("unexpected JSON content");
        return value;
    }

    private Object value() {
        whitespace();
        if (index >= input.length()) throw error("unexpected end of JSON");
        return switch (input.charAt(index)) {
            case '{' -> object();
            case '[' -> array();
            case '"' -> string();
            case 't' -> literal("true", Boolean.TRUE);
            case 'f' -> literal("false", Boolean.FALSE);
            case 'n' -> literal("null", null);
            default -> number();
        };
    }

    private Map<String, Object> object() {
        expect('{');
        Map<String, Object> result = new LinkedHashMap<>();
        whitespace();
        if (consume('}')) return result;
        while (true) {
            whitespace();
            if (index >= input.length() || input.charAt(index) != '"') throw error("object key must be a string");
            String key = string();
            whitespace();
            expect(':');
            result.put(key, value());
            whitespace();
            if (consume('}')) return result;
            expect(',');
        }
    }

    private List<Object> array() {
        expect('[');
        List<Object> result = new ArrayList<>();
        whitespace();
        if (consume(']')) return result;
        while (true) {
            result.add(value());
            whitespace();
            if (consume(']')) return result;
            expect(',');
        }
    }

    private String string() {
        expect('"');
        StringBuilder result = new StringBuilder();
        while (index < input.length()) {
            char character = input.charAt(index++);
            if (character == '"') return result.toString();
            if (character != '\\') {
                if (character < 0x20) throw error("control character in JSON string");
                result.append(character);
                continue;
            }
            if (index >= input.length()) throw error("unfinished JSON escape");
            char escaped = input.charAt(index++);
            switch (escaped) {
                case '"' -> result.append('"');
                case '\\' -> result.append('\\');
                case '/' -> result.append('/');
                case 'b' -> result.append('\b');
                case 'f' -> result.append('\f');
                case 'n' -> result.append('\n');
                case 'r' -> result.append('\r');
                case 't' -> result.append('\t');
                case 'u' -> result.append(unicodeEscape());
                default -> throw error("unsupported JSON escape: " + escaped);
            }
        }
        throw error("unfinished JSON string");
    }

    private char unicodeEscape() {
        if (index + 4 > input.length()) throw error("unfinished unicode escape");
        int value = 0;
        for (int offset = 0; offset < 4; offset++) {
            int digit = Character.digit(input.charAt(index++), 16);
            if (digit < 0) throw error("invalid unicode escape");
            value = value * 16 + digit;
        }
        return (char) value;
    }

    private Object number() {
        int start = index;
        consume('-');
        digits();
        if (consume('.')) digits();
        if (index < input.length() && (input.charAt(index) == 'e' || input.charAt(index) == 'E')) {
            index++;
            if (index < input.length() && (input.charAt(index) == '+' || input.charAt(index) == '-')) index++;
            digits();
        }
        String token = input.substring(start, index);
        try {
            return token.contains(".") || token.contains("e") || token.contains("E") ? Double.parseDouble(token) : Long.parseLong(token);
        } catch (NumberFormatException exception) {
            throw error("invalid JSON number: " + token);
        }
    }

    private void digits() {
        int start = index;
        while (index < input.length() && Character.isDigit(input.charAt(index))) index++;
        if (start == index) throw error("expected JSON number digits");
    }

    private Object literal(String expected, Object value) {
        if (!input.startsWith(expected, index)) throw error("invalid JSON literal");
        index += expected.length();
        return value;
    }

    private void whitespace() {
        while (index < input.length() && Character.isWhitespace(input.charAt(index))) index++;
    }

    private boolean consume(char expected) {
        if (index < input.length() && input.charAt(index) == expected) {
            index++;
            return true;
        }
        return false;
    }

    private void expect(char expected) {
        if (!consume(expected)) throw error("expected '" + expected + "'");
    }

    private IllegalArgumentException error(String message) {
        return new IllegalArgumentException(message + " at character " + index);
    }
}
