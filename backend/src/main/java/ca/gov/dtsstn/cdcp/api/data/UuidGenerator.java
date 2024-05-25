package ca.gov.dtsstn.cdcp.api.data;

import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;
import org.hibernate.generator.EventTypeSets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings({ "serial" })
public class UuidGenerator implements BeforeExecutionGenerator {

	private static final Logger log = LoggerFactory.getLogger(UuidGenerator.class);

	private final transient ValueGenerator valueGenerator;

	public UuidGenerator() {
		this(UUID::randomUUID);
	}

	public UuidGenerator(ValueGenerator valueGenerator) {
		this.valueGenerator = valueGenerator;
	}

	@Override
	public Object generate(SharedSessionContractImplementor session, Object owner, Object currentValue, EventType eventType) {
		final var id = Optional.ofNullable(session.getEntityPersister(null, owner).getIdentifier(owner, session));
		id.ifPresent(val -> log.debug("Not generating ID for [{}] because it already has id [{}]", owner.getClass().getSimpleName(), val));
		return id.orElseGet(() -> valueGenerator.generateUuid().toString());
	}

	@Override
	public EnumSet<EventType> getEventTypes() {
		return EventTypeSets.INSERT_ONLY;
	}

	public interface ValueGenerator {

		UUID generateUuid();

	}

}
