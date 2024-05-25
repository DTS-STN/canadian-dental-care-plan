package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity(name = "Subscription")
@SuppressWarnings({ "serial" })
public class SubscriptionEntity extends AbstractEntity {

	@ManyToOne(optional = false)
	private AlertTypeEntity alertType;

	@ManyToOne(optional = false)
	private LanguageEntity language;

	public SubscriptionEntity() {
		super();
	}

	@Builder.Constructor
	protected SubscriptionEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable AlertTypeEntity alertType,
			@Nullable LanguageEntity language) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.alertType = alertType;
		this.language = language;
	}

	public AlertTypeEntity getAlertType() {
		return alertType;
	}

	public void setAlertType(AlertTypeEntity alertType) {
		this.alertType = alertType;
	}

	public LanguageEntity getLanguage() {
		return language;
	}

	public void setLanguage(LanguageEntity language) {
		this.language = language;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("alertType", alertType)
			.append("language", language)
			.toString();
	}

}
