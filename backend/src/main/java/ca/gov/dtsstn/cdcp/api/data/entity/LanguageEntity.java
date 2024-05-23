package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity(name = "Language")
@SuppressWarnings({ "serial" })
public class LanguageEntity extends AbstractEntity {

	@Column(length = 16, nullable = false)
	private String code;

	@Column(length = 256)
	private String description;

	@Column(length = 16)
	private String isoCode;
	
	@Column(length = 16)
	private String msLocaleCode;	

	public LanguageEntity() {
		super();
	}

	@Builder.Constructor
	protected LanguageEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable String code,
			@Nullable String description,
			@Nullable String isoCode,
			@Nullable String msLocaleCode) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.code = code;
		this.description = description;
		this.isoCode = isoCode;
		this.msLocaleCode = msLocaleCode;
	}

	public String getCode() {
		return this.code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getDescription() {
		return this.description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getIsoCode() {
		return this.isoCode;
	}

	public void setIsoCode(String isoCode) {
		this.isoCode = isoCode;
	}	

	public String getMsLocaleCode() {
		return this.msLocaleCode;
	}

	public void setMsLocaleCode(String msLocaleCode) {
		this.msLocaleCode = msLocaleCode;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("code", code)
			.append("description", description)
			.append("isoCode", description)
			.append("msLocaleCode", description)
			.toString();
	}

}
