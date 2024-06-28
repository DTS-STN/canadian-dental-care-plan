package ca.gov.dtsstn.cdcp.api.event;

import org.mapstruct.factory.Mappers;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import ca.gov.dtsstn.cdcp.api.data.entity.EventLogEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.repository.EventLogRepository;

@Component
public class ApplicationEventListener {

	private final EventLogRepository eventLogRepository;

	private final EventTypeMapper eventTypeMapper = Mappers.getMapper(EventTypeMapper.class);

	private final ObjectMapper objectMapper = new ObjectMapper()
		.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
		.findAndRegisterModules();

	public ApplicationEventListener(EventLogRepository eventLogRepository) {
		Assert.notNull(eventLogRepository, "eventLogRepository is required; it must not be null");
		this.eventLogRepository = eventLogRepository;
	}

	@Async
	@EventListener({ ApplicationEvent.class })
	public void handleEvent(ApplicationEvent<?> applicationEvent) throws JsonProcessingException {
		eventLogRepository.save(new EventLogEntityBuilder()
			.actor(applicationEvent.getActor())
			.description(applicationEvent.getDescription())
			.details(objectMapper.writeValueAsString(applicationEvent))
			.eventType(eventTypeMapper.map(applicationEvent.getEventType()))
			.source(applicationEvent.getSource())
			.build());
	}

}
