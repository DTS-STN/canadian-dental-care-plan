package ca.gov.dtsstn.cdcp.api.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import ca.gov.dtsstn.cdcp.api.data.entity.EventLogEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.EventLogType;
import ca.gov.dtsstn.cdcp.api.data.repository.EventLogRepository;

@ExtendWith({ MockitoExtension.class })
class ApplicationEventListenerTests {

	@Mock EventLogRepository eventLogRepository;

	@Captor ArgumentCaptor<EventLogEntity> eventLogEntityCaptor;

	ApplicationEventListener applicationEventListener;

	final ObjectMapper objectMapper = new ObjectMapper()
		.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
		.findAndRegisterModules();

	@BeforeEach
	void beforeEach() {
		this.applicationEventListener = new ApplicationEventListener(eventLogRepository);
	}

	@Test
	@DisplayName("Test ApplicationEventListener.handleEvent(..)")
	void testHandleEvent() throws JsonProcessingException {
		final var applicationEvent = new TestApplicationEvent();
		final var applicationEventStr = objectMapper.writeValueAsString(applicationEvent);

		applicationEventListener.handleEvent(applicationEvent);
		verify(eventLogRepository).save(eventLogEntityCaptor.capture());

		assertThat(eventLogEntityCaptor.getValue())
			.matches(eventLogEntity -> eventLogEntity.getActor().equals("JUnit Jupiter"), "has correct actor")
			.matches(eventLogEntity -> eventLogEntity.getDescription().equals("A test event has occurred"), "has correct description")
			.matches(eventLogEntity -> eventLogEntity.getDetails().equals(applicationEventStr), "has correct details")
			.matches(eventLogEntity -> eventLogEntity.getEventType().equals(EventLogType.UNKNOWN), "has correct event type")
			.matches(eventLogEntity -> eventLogEntity.getSource().equals(ApplicationEventListenerTests.class.getSimpleName()), "has correct source");
	}

	class TestApplicationEvent implements ApplicationEvent<String> {

		@Override
		public String getActor() {
			return "JUnit Jupiter";
		}

		@Override
		public String getDescription() {
			return "A test event has occurred";
		}

		@Override
		public String getEventType() {
			return "YANNIS";
		}

		@Override
		public String getPayload() {
			return "foo";
		}

		@Override
		public String getSource() {
			return ApplicationEventListenerTests.class.getSimpleName();
		}

		@Override
		public Instant getTimestamp() {
			return Instant.EPOCH;
		}

	}

}
