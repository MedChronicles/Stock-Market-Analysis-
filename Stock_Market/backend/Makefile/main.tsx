# Makefile for Stock Trading Matching Engine

CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
TARGET = matching_engine
SRC = matching_engine.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC)
	@echo "✅ Build successful! Run with: ./$(TARGET)"

clean:
	rm -f $(TARGET)
	@echo "🧹 Cleaned build files"

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run
