package ca.gov.dtsstn.cdcp.api.event;

import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ValueMapping;

import ca.gov.dtsstn.cdcp.api.data.entity.EventLogType;

@Mapper
public interface EventTypeMapper {

	@ValueMapping(source = MappingConstants.NULL, target = "UNSPECIFIED")
	@ValueMapping(source = MappingConstants.ANY_REMAINING, target = "UNKNOWN")
	EventLogType map(String eventType);

}
