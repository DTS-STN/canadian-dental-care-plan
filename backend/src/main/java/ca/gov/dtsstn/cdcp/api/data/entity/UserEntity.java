package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

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
	private Set<UserAttributeEntity> userAttributes = new HashSet<>();

	@JoinColumn(name = "userId", nullable = false)
	@OneToMany(cascade = { CascadeType.ALL }, orphanRemoval = true)
	private Set<SubscriptionEntity> subscriptions = new HashSet<>();

	public UserEntity() {
		super();
	}

	@Builder.Constructor
	public UserEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable Iterable<ConfirmationCodeEntity> confirmationCodes,
			@Nullable String email,
			@Nullable Boolean emailVerified,
			@Nullable Iterable<UserAttributeEntity> userAttributes,
			@Nullable Iterable<SubscriptionEntity> subscriptions,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);

		this.email = email;
		this.emailVerified = emailVerified;

		if (confirmationCodes != null) {
			this.confirmationCodes = StreamSupport.stream(confirmationCodes.spliterator(), false).collect(Collectors.toSet());
		}

		if (userAttributes != null) {
			this.userAttributes = StreamSupport.stream(userAttributes.spliterator(), false).collect(Collectors.toSet());
		}

		if (subscriptions != null) {
			this.subscriptions = StreamSupport.stream(subscriptions.spliterator(), false).collect(Collectors.toSet());
		}
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

	public void setUserAttributes(Iterable<UserAttributeEntity> userAttributes) {
		this.userAttributes = userAttributes == null ? null : StreamSupport.stream(userAttributes.spliterator(), false).collect(Collectors.toSet());
	}

	public Set<ConfirmationCodeEntity> getConfirmationCodes() {
		return confirmationCodes;
	}

	public void setConfirmationCodes(Iterable<ConfirmationCodeEntity> confirmationCodes) {
		this.confirmationCodes = confirmationCodes == null ? null : StreamSupport.stream(confirmationCodes.spliterator(), false).collect(Collectors.toSet());
	}

	public Set<SubscriptionEntity> getSubscriptions() {
		return subscriptions;
	}

	public void setSubscriptions(Iterable<SubscriptionEntity> subscriptions) {
		this.subscriptions = subscriptions == null ? null :StreamSupport.stream(subscriptions.spliterator(), false).collect(Collectors.toSet());
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
