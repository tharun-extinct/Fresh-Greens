# Test Implementation

**Fresh Greens Testing Documentation** ── This document outlines the unit testing strategy, the tools configured, and the specific methods used to ensure the reliability of the backend `server` application. 

---

<br>
<br>

## 📁 Files Created & Modified

To establish a robust and isolated testing environment, the following files were implemented or updated:

### Created Test Classes
- **`server/src/test/.../service/ProductServiceTest.java`**
  Unit tests for the `ProductService`, verifying that product details can be fetched and mapped correctly to their DTOs (`ProductResponse`) alongside their respective seller details.
  
- **`server/src/test/.../service/CartServiceTest.java`**
  Unit tests for the `CartService`, validating operations like fetching an empty cart and ensuring amounts and totals are calculated accurately.

- **`server/src/test/.../service/UserServiceTest.java`**
  Unit tests for `UserService` that valid user retrievals, verifying email addresses, and performing user detail updates.

- **`server/src/test/.../service/OrderServiceTest.java`**
  Unit tests for the `OrderService` evaluating retrieving order details effectively mapping `Order` domains to `OrderResponse` models, and verifying empty order paginations without triggering Razorpay logic directly.

### Configuration & Environment
- **`server/src/test/resources/application-test.properties`**
  Configured to use an **H2 In-Memory Database** (`jdbc:h2:mem:testdb`) so that tests run completely independently of the local MySQL instance. This prevents data corruption or missing database credentials from stopping the build pipeline.
  
- **`server/pom.xml`**
  Added the `com.h2database:h2` dependency scoped specifically for the test phase. Fixed structural issues to allow Maven test goals to execute properly.
  
- **`server/src/main/.../config/DataInitializer.java`**
  Annotated with `@Profile("!test")` to prevent the production database seeders from running and crashing during the lightweight unit tests.

---

<br>
<br>

## 📦 Core Packages & Dependencies

- `org.junit.jupiter` (**JUnit 5**): The primary framework for writing and running the test assertions.
- `org.mockito` (**Mockito**): Used for isolating components by mocking external dependencies (like repositories).
- `org.springframework.boot.test`: Spring Boot's testing utilities for spinning up test contexts.
- `com.h2database`: A lightweight, rapidly-booted SQL database used only in memory during tests.

---

<br>
<br>

## 🛠️ Why JUnit and Mockito?

### **JUnit 5**
> **What is it?** JUnit is the industry standard unit testing framework for the Java ecosystem. 
> 
> **Why do we use it?** It provides the foundational structure to execute code snippets conditionally and verify if they succeed or fail. Through intuitive annotations (like `@Test`), it lets us easily define, group, and run independent test cases to verify business logic.

### **Mockito**
> **What is it?** Mockito is a popular mocking framework used in tandem with JUnit. It allows you to create "fake" (mock) objects of external dependencies.
> 
> **Why do we use it?** In unit testing, you only want to test **one specific class** (e.g., `ProductService`). You don't want to test the Database (`ProductRepository`) at the same time because a database failure would fail your logic test. Mockito lets us simulate database responses so we can focus strictly on the Java logic.

---

<br>
<br>

## 🔍 Key Methods & Annotations Used

Here is a quick reference guide to the testing tools utilized in our test classes:

### Structural Annotations
| Annotation | Description |
| :--- | :--- |
| `@ExtendWith(MockitoExtension.class)` | Initializes Mockito within the JUnit 5 lifecycle. It tells JUnit to process the `@Mock` and `@InjectMocks` annotations automatically. |
| `@Test` | Tells the JUnit runner that the method right below it is a test case the framework should execute. |

<br>

### Mocking Annotations
| Annotation | Description |
| :--- | :--- |
| `@Mock` | Creates a fictional (mocked) version of a dependency (e.g., `@Mock ProductRepository`). It tracks interactions but contains no real logic. |
| `@InjectMocks` | Acts on the main class you are testing. It automatically grabs all the fields marked with `@Mock` and passes them into this class's constructor. |

<br>

### Stubbing (Simulating Behavior)
```java
when(repository.findById(1L)).thenReturn(Optional.of(mockProduct));
```
- **`when(...)`**: Listens for a specific method execution on a mock object.
- **`thenReturn(...)`**: Dictates exactly what the mock should spit back out. *("When the repository is asked for ID 1, return this fake Product I just made").*

<br>

### Assertions (Verifying Correctness)
```java
assertNotNull(result);
assertEquals("Expected String", result.getTitle());
```
- **`assertNotNull(object)`**: Ensures that the service actually returned an object, preventing accidental `NullPointerException` bugs in production.
- **`assertEquals(expected, actual)`**: Compares two values. If the `result.getTitle()` does not exactly match `"Expected String"`, the test runner halts and marks the test as a **FAILURE**.

<br>
<br>


```
& "c:\Project\fresh-greens\server\mvnw.cmd" clean test -f "c:\Project\fresh-greens\server\pom.xml"
```