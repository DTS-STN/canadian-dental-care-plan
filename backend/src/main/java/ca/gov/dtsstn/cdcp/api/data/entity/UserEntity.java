package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;

@Entity(name = "User")
@SuppressWarnings({ "serial" })
public class UserEntity extends AbstractEntity {

	@JoinColumn(name = "userId", nullable = false)
	@OneToMany(cascade = { CascadeType.ALL }, orphanRemoval = true)
	private Set<ConfirmationCodeEntity> confirmationCodes = new HashSet<>();

	@Column(length = 256, nullable = true)
	private String email;

	@Column(nullable = true)
	private Boolean emailVerified;

	@JoinColumn(name = "userId", nullable = false)
	@OneToMany(cascade = { CascadeType.ALL }, orphanRemoval = true)
	private Set<SubscriptionEntity> subscriptions = new HashSet<>();

	@JoinColumn(name = "userId", nullable = false)
	@OneToMany(cascade = { CascadeType.ALL }, orphanRemoval = true)
	private Set<UserAttributeEntity> userAttributes = new HashSet<>();

	public UserEntity() {
		super();
	}

	@Builder.Constructor
	public UserEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable Collection<ConfirmationCodeEntity> confirmationCodes,
			@Nullable String email,
			@Nullable Boolean emailVerified,
			@Nullable Collection<SubscriptionEntity> subscriptions,
			@Nullable Collection<UserAttributeEntity> userAttributes) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);

		this.email = email;
		this.emailVerified = emailVerified;

		if (confirmationCodes != null) { this.confirmationCodes = new HashSet<>(confirmationCodes); }
		if (subscriptions != null) { this.subscriptions = new HashSet<>(subscriptions); }
		if (userAttributes != null) { this.userAttributes = new HashSet<>(userAttributes); }
	}

	public Set<ConfirmationCodeEntity> getConfirmationCodes() {
		return confirmationCodes;
	}

	public void setConfirmationCodes(Collection<ConfirmationCodeEntity> confirmationCodes) {
		this.confirmationCodes = confirmationCodes == null ? new HashSet<> () : new HashSet<>(confirmationCodes);
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Boolean getEmailVerified() {
		return emailVerified;
	}

	public void setEmailVerified(Boolean emailVerified) {
		this.emailVerified = emailVerified;
	}

	public Set<UserAttributeEntity> getUserAttributes() {
		return userAttributes;
	}

	public void setUserAttributes(Collection<UserAttributeEntity> userAttributes) {
		this.userAttributes = userAttributes == null ? new HashSet<> () : new HashSet<>(userAttributes);
	}

	public Set<SubscriptionEntity> getSubscriptions() {
		return subscriptions;
	}

	public void setSubscriptions(Collection<SubscriptionEntity> subscriptions) {
		this.subscriptions = subscriptions == null ? new HashSet<> () : new HashSet<>(subscriptions);
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("confirmationCodes", confirmationCodes)
			.append("email", email)
			.append("emailVerified", emailVerified)
			.append("subscriptions", subscriptions)
			.append("userAttributes", userAttributes)
			.toString();
	}

}
