package com.example.journalApp.entity;

import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class JournalEntryTest {

    @Test
    void gettersAndSettersWorkForAllFields() {
        JournalEntry entry = new JournalEntry();
        ObjectId id = new ObjectId();
        Date date = new Date();

        entry.setId(id);
        entry.setTitle("Title");
        entry.setContent("Content");
        entry.setDate(date);

        assertSame(id, entry.getId());
        assertEquals("Title", entry.getTitle());
        assertEquals("Content", entry.getContent());
        assertSame(date, entry.getDate());
    }
}