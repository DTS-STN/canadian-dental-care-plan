package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity(name = "Subscription")
@SuppressWarnings({ "serial" })
public class SubscriptionEntity extends AbstractEntity {

	@ManyToOne
	private AlertTypeEntity alertType;

	@Column(length = 256, nullable = false)
	private String email;

	@Column(nullable = false)
	private Long preferredLanguage ;

	@Column(nullable = true)
	private Boolean registered;

	@Column(nullable = true)
	private Boolean subscribed;

	@Column(length = 9, nullable = false, updatable = false)
	private String userId;

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
			@Nullable String email,
			@Nullable Long preferredLanguage,
			@Nullable Boolean registered,
			@Nullable Boolean subscribed,
			@Nullable String userId) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.alertType = alertType;
		this.email = email;
		this.preferredLanguage = preferredLanguage;
		this.registered = registered;
		this.subscribed = subscribed;
		this.userId = userId;
	}

	public AlertTypeEntity getAlertType() {
		return alertType;
	}

	public void setAlertType(AlertTypeEntity alertType) {
		this.alertType = alertType;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Long getPreferredLanguage() {
		return preferredLanguage;
	}

	public void setPreferredLanguage(Long preferredLanguage) {
		this.preferredLanguage = preferredLanguage;
	}

	public Boolean getRegistered() {
		return registered;
	}

	public void setRegistered(Boolean registered) {
		this.registered = registered;
	}

	public Boolean getSubscribed() {
		return subscribed;
	}

	public void setSubscribed(Boolean subscribed) {
		this.subscribed = subscribed;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("alertType", alertType)
			.append("email", email)
			.append("preferredLanguage", preferredLanguage)
			.append("registered", registered)
			.append("subscribed", subscribed)
			.append("userId", userId)
			.toString();
	}

}
