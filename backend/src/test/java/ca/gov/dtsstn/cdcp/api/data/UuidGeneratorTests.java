package ca.gov.dtsstn.cdcp.api.data;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.EventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith({ MockitoExtension.class })
class UuidGeneratorTests {

	UuidGenerator uuidGenerator;

	final UUID id = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		this.uuidGenerator = new UuidGenerator(() -> id);
	}

	@Test
	void testGenerate_withId() {
		final var sharedSessionContractImplementor = mock(SharedSessionContractImplementor.class, Mockito.RETURNS_DEEP_STUBS);
		when(sharedSessionContractImplementor.getEntityPersister(any(), any()).getIdentifier(any(), any(SharedSessionContractImplementor.class))).thenReturn(id.toString());
		assertThat(uuidGenerator.generate(sharedSessionContractImplementor, null, new Object(), EventType.INSERT)).asString().isEqualTo(id.toString());
	}

	@Test
	void testGenerate_withNullId() {
		final var sharedSessionContractImplementor = mock(SharedSessionContractImplementor.class, Mockito.RETURNS_DEEP_STUBS);
		when(sharedSessionContractImplementor.getEntityPersister(any(), any()).getIdentifier(any(), any(SharedSessionContractImplementor.class))).thenReturn(null);
		assertThat(uuidGenerator.generate(sharedSessionContractImplementor, null, new Object(), EventType.INSERT)).asString().isEqualTo(id.toString());
	}

}
