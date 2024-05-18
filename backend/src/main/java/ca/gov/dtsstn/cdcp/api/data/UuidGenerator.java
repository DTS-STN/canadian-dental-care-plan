package ca.gov.dtsstn.cdcp.api.data;

import java.util.Optional;
import java.util.UUID;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

/**
 * A Hibernate {@link IdentifierGenerator} that will generate a string-representation of a {@link UUID}.
 * <p>
 * Usage example:
 * <pre>
 * {@code @Id}
 * {@code @Column(nullable = false, updatable = false)}
 * {@code @GeneratedValue(generator = "uuid-generator")}
 * {@code @GenericGenerator(name = "uuid-generator", strategy = UuidGenerator.STRATEGY)}
 * {@code private String id;}
 * </pre>
 */
@SuppressWarnings({ "serial" })
public class UuidGenerator implements IdentifierGenerator {

	private final transient ValueGenerator valueGenerator;

	public UuidGenerator() {
		this(UUID::randomUUID);
	}

	public UuidGenerator(ValueGenerator valueGenerator) {
		this.valueGenerator = valueGenerator;
	}

	@Override
	public Object generate(SharedSessionContractImplementor session, Object object) {
		final var id = session.getEntityPersister(null, object).getIdentifier(object, session);
		return Optional.ofNullable(id).orElseGet(() -> valueGenerator.generateUuid().toString());
	}

	public interface ValueGenerator {

		UUID generateUuid();

	}

}
