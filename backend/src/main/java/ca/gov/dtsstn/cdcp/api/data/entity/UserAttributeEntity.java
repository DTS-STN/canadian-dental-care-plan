package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity(name = "UserAttribute")
@SuppressWarnings({ "serial" })
public class UserAttributeEntity extends AbstractEntity {

	@Column(length = 256, nullable = false, updatable = false)
	private String name;

	@Column(length = 2048, nullable = true)
	private String value;

	public UserAttributeEntity() {
		super();
	}

	@Builder.Constructor
	public UserAttributeEntity(
			@Nullable String id,
			@Nullable String name,
			@Nullable String value,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable Boolean isNew) {
		super(id, createdBy, createdDate, lastModifiedBy, lastModifiedDate, isNew);
		this.name = name;
		this.value = value;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("name", name)
			.append("value", value)
			.toString();
	}

}
