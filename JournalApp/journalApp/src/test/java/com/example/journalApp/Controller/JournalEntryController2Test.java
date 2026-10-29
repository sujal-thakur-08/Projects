package com.example.journalApp.Controller;

import com.example.journalApp.entity.JournalEntry;
import com.example.journalApp.service.JournalEntryService;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class JournalEntryController2Test {

    private JournalEntryController2 controller;
    private StubJournalEntryService service;

    @BeforeEach
    void setUp() throws Exception {
        controller = new JournalEntryController2();
        service = new StubJournalEntryService();
        setField(controller, "journalEntryService", service);
    }

    @Test
    void getAllJournalEntriesReturnsOkWhenEntriesExist() {
        JournalEntry entry = journalEntry("Title", "Body");
        service.allEntries = List.of(entry);

        ResponseEntity<List<JournalEntry>> response = controller.getAllJournalEntries();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void getAllJournalEntriesReturnsNotFoundWhenEmpty() {
        service.allEntries = new ArrayList<>();

        ResponseEntity<List<JournalEntry>> response = controller.getAllJournalEntries();

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void createEntryReturnsCreated() {
        JournalEntry entry = journalEntry("Create", "Me");

        ResponseEntity<JournalEntry> response = controller.createEntry(entry);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(entry, response.getBody());
        assertEquals(entry, service.savedEntry);
    }

    @Test
    void createEntryReturnsBadRequestWhenSaveFails() {
        service.throwOnSave = true;

        ResponseEntity<JournalEntry> response = controller.createEntry(journalEntry("Bad", "Request"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void getJournalEntryByIdReturnsOkWhenFound() {
        JournalEntry entry = journalEntry("Found", "Entry");
        service.entryById = Optional.of(entry);

        ResponseEntity<JournalEntry> response = controller.getJournalEntryById(entry.getId());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(entry, response.getBody());
    }

    @Test
    void getJournalEntryByIdReturnsNotFoundWhenMissing() {
        service.entryById = Optional.empty();

        ResponseEntity<JournalEntry> response = controller.getJournalEntryById(new ObjectId());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void deleteJournalEntryByIdReturnsNoContentWhenRemoved() {
        service.deleteResult = true;

        ResponseEntity<?> response = controller.deleteJournalEntryById(new ObjectId());

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void updateJournalByIdUpdatesExistingEntry() {
        JournalEntry existing = journalEntry("Old title", "Old content");
        existing.setId(new ObjectId());
        service.entryById = Optional.of(existing);

        JournalEntry update = new JournalEntry();
        update.setTitle("");
        update.setContent("New content");

        ResponseEntity<JournalEntry> response = controller.updateJournalById(existing.getId(), update);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Old title", response.getBody().getTitle());
        assertEquals("New content", response.getBody().getContent());
        assertEquals(response.getBody(), service.savedEntry);
    }

    @Test
    void updateJournalByIdReturnsNotFoundWhenEntryMissing() {
        service.entryById = Optional.empty();

        ResponseEntity<JournalEntry> response = controller.updateJournalById(new ObjectId(), new JournalEntry());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    private static JournalEntry journalEntry(String title, String content) {
        JournalEntry entry = new JournalEntry();
        entry.setId(new ObjectId());
        entry.setTitle(title);
        entry.setContent(content);
        return entry;
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static final class StubJournalEntryService extends JournalEntryService {
        private List<JournalEntry> allEntries = List.of();
        private Optional<JournalEntry> entryById = Optional.empty();
        private boolean deleteResult = true;
        private boolean throwOnSave;
        private JournalEntry savedEntry;

        @Override
        public void saveEntry(JournalEntry journalEntry) {
            if (throwOnSave) {
                throw new IllegalStateException("save failed");
            }
            savedEntry = journalEntry;
        }

        @Override
        public List<JournalEntry> getAll() {
            return allEntries;
        }

        @Override
        public Optional<JournalEntry> findById(ObjectId id) {
            return entryById;
        }

        @Override
        public boolean deleteById(ObjectId id) {
            return deleteResult;
        }
    }
}