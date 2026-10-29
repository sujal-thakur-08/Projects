package com.example.journalApp.service;

import com.example.journalApp.entity.JournalEntry;
import com.example.journalApp.repository.JournalEntryRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JournalEntryServiceTest {

    private JournalEntryService service;
    private InMemoryJournalEntryRepository repository;

    @BeforeEach
    void setUp() throws Exception {
        service = new JournalEntryService();
        repository = new InMemoryJournalEntryRepository();
        setField(service, "journalEntryRepository", repository.proxy());
    }

    @Test
    void saveEntryDelegatesToRepository() {
        JournalEntry entry = journalEntry("Title 1", "Content 1");

        service.saveEntry(entry);

        assertSame(entry, repository.savedEntry);
        assertTrue(repository.store.containsKey(entry.getId()));
    }

    @Test
    void getAllReturnsRepositoryResults() {
        JournalEntry first = journalEntry("First", "One");
        JournalEntry second = journalEntry("Second", "Two");
        repository.put(first);
        repository.put(second);

        List<JournalEntry> allEntries = service.getAll();

        assertEquals(2, allEntries.size());
        assertTrue(allEntries.contains(first));
        assertTrue(allEntries.contains(second));
    }

    @Test
    void findByIdReturnsMatchingEntry() {
        JournalEntry entry = journalEntry("Match", "Found");
        repository.put(entry);

        Optional<JournalEntry> result = service.findById(entry.getId());

        assertTrue(result.isPresent());
        assertEquals(entry, result.get());
    }

    @Test
    void findByIdReturnsEmptyWhenMissing() {
        Optional<JournalEntry> result = service.findById(new ObjectId());

        assertFalse(result.isPresent());
    }

    @Test
    void deleteByIdDelegatesToRepository() {
        JournalEntry entry = journalEntry("Delete", "Me");
        repository.put(entry);

        boolean removed = service.deleteById(entry.getId());

        assertTrue(removed);
        assertFalse(repository.store.containsKey(entry.getId()));
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

    private static final class InMemoryJournalEntryRepository {
        private final Map<ObjectId, JournalEntry> store = new HashMap<>();
        private JournalEntry savedEntry;

        private JournalEntryRepository proxy() {
            return (JournalEntryRepository) Proxy.newProxyInstance(
                    JournalEntryRepository.class.getClassLoader(),
                    new Class<?>[]{JournalEntryRepository.class},
                    (proxy, method, args) -> {
                        String methodName = method.getName();
                        return switch (methodName) {
                            case "save" -> {
                                savedEntry = (JournalEntry) args[0];
                                if (savedEntry.getId() == null) {
                                    savedEntry.setId(new ObjectId());
                                }
                                store.put(savedEntry.getId(), savedEntry);
                                yield savedEntry;
                            }
                            case "findAll" -> new ArrayList<>(store.values());
                            case "findById" -> Optional.ofNullable(store.get((ObjectId) args[0]));
                            case "deleteById" -> {
                                store.remove((ObjectId) args[0]);
                                yield null;
                            }
                            case "existsById" -> store.containsKey((ObjectId) args[0]);
                            case "count" -> (long) store.size();
                            default -> defaultValue(method.getReturnType());
                        };
                    }
            );
        }

        private void put(JournalEntry entry) {
            store.put(entry.getId(), entry);
        }

        private Object defaultValue(Class<?> returnType) {
            if (returnType.equals(boolean.class)) {
                return false;
            }
            if (returnType.equals(int.class) || returnType.equals(short.class) || returnType.equals(byte.class)) {
                return 0;
            }
            if (returnType.equals(long.class)) {
                return 0L;
            }
            if (returnType.equals(double.class)) {
                return 0d;
            }
            if (returnType.equals(float.class)) {
                return 0f;
            }
            return null;
        }
    }
}