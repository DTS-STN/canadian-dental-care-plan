package ca.gov.dtsstn.cdcp.api.config.properties;

import java.time.temporal.ChronoUnit;

import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Email notification properties for the application.
 */
@Validated
public class EmailNotificationProperties {

	@NestedConfigurationProperty
	private final ConfirmationCodeProperties confirmationCodes = new ConfirmationCodeProperties();

	public ConfirmationCodeProperties getConfirmationCodes() {
		return confirmationCodes;
	}

	/**
	 * Confirmation code notification properties for the application.
	 */
	@Validated
	public static class ConfirmationCodeProperties {

		@NestedConfigurationProperty
		private final ExpiryProperties expiry = new ExpiryProperties();

		/**
		 * The length of the generated confirmation code.
		 * Must be between 1 and 8 characters.
		 * Defaults to {@code 5}.
		 */
		@Min(1) @Max(8)
		private Integer length = 5;

		public ExpiryProperties getExpiry() {
			return expiry;
		}

		public Integer getLength() {
			return length;
		}

		public void setLength(Integer length) {
			this.length = length;
		}

		/**
		 * Configuration properties for confirmation code expiry.
		 */
		@Validated
		public static class ExpiryProperties {

			/**
			 * The time unit used for the expiry value.
			 * Defaults to {@link ChronoUnit#MINUTES}.
			 */
			private ChronoUnit timeUnit = ChronoUnit.MINUTES;

			/**
			 * The value of the expiry time.
			 * Must be a non-negative integer.
			 */
			@Min(0)
			private Integer value;

			public ChronoUnit getTimeUnit() {
				return timeUnit;
			}

			public void setTimeUnit(ChronoUnit timeUnit) {
				this.timeUnit = timeUnit;
			}

			public Integer getValue() {
				return value;
			}

			public void setValue(Integer value) {
				this.value = value;
			}

		}

	}

}
