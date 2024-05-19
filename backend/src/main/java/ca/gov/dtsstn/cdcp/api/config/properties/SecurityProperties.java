package ca.gov.dtsstn.cdcp.api.config.properties;

import org.springframework.validation.annotation.Validated;

/**
 * Security properties for the application.
 */
@Validated
public class SecurityProperties {

	/**
	 * Whether or not security is enabled or disabled globally.
	 * Defaults to {@code false}.
	 */
	private boolean enabled = false;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

}
