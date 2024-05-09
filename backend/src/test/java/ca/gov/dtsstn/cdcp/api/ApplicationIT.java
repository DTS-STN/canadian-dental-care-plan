package ca.gov.dtsstn.cdcp.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ApplicationIT {

	@Autowired ApplicationContext applicationContext;

	@Test void contextLoads() {
		assertThat(applicationContext).isNotNull();
	}

}