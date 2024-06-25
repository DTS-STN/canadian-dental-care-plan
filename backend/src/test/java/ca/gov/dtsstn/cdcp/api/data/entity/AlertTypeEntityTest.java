package ca.gov.dtsstn.cdcp.api.data.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@SuppressWarnings("serial")
@ExtendWith({ MockitoExtension.class })
class AlertTypeEntityTest extends AlertTypeEntity {

	AlertTypeEntity alertTypeEntity;

	@BeforeEach
	void beforeEach() {
		this.alertTypeEntity = new AlertTypeEntity();
	}

	@Test
	final void testHashCode() {
		alertTypeEntity.setCode("0000");
		AlertTypeEntity otherAlertTypeEntity = new AlertTypeEntity();
		otherAlertTypeEntity.setCode("0000");
		assertThat(alertTypeEntity).hasSameHashCodeAs(otherAlertTypeEntity);
	}

	@Test
	final void testEqualsObjectNull() {
		assertThat(alertTypeEntity.equals(null)).isFalse();
	}

	@Test
	final void testEqualsObjectDoesNotMatch() {
		alertTypeEntity.setCode("0000");
		AlertTypeEntity otherAlertTypeEntity = new AlertTypeEntity();
		otherAlertTypeEntity.setCode("1111");
		assertThat(alertTypeEntity.equals(otherAlertTypeEntity)).isFalse();
	}

	@Test
	final void testEqualsObjectDoesMatch() {
		alertTypeEntity.setCode("0000");
		AlertTypeEntity otherAlertTypeEntity = new AlertTypeEntity();
		otherAlertTypeEntity.setCode("0000");
		assertThat(alertTypeEntity.equals(otherAlertTypeEntity)).isTrue();
	}

}
