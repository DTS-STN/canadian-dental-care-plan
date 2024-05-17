package ca.gov.dtsstn.cdcp.api.config.properties;

import java.time.temporal.ChronoUnit;

import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
public class EmailNotificationProperties {

	private final ConfirmationCodeProperties confirmationCodes = new ConfirmationCodeProperties();

	public ConfirmationCodeProperties getConfirmationCodes() {
		return confirmationCodes;
	}

	@Validated
	public static class ConfirmationCodeProperties {

		@NestedConfigurationProperty
		private final ExpiryProperties expiry = new ExpiryProperties();

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

		@Validated
		public static class ExpiryProperties {

			private ChronoUnit timeUnit;

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
