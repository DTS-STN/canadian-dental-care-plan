package ca.gov.dtsstn.cdcp.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.event.EventListener;

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;

/**
 * Main application class for the Canadian Dental Care Plan API.
 *
 * This class is responsible for starting the Spring Boot application and logging
 * information about the application's startup.
 */
@SpringBootApplication
@EnableConfigurationProperties({ ApplicationProperties.class })
public class Application {

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	/**
	 * Main method for the application.
	 */
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	/**
	 * Event listener for the {@link ApplicationReadyEvent}.
	 * <p>
	 * This method logs information about the application's startup, including the
	 * application name, server port, and context path.
	 */
	@EventListener({ ApplicationReadyEvent.class })
	protected void handleApplicationReadyEvent(ApplicationReadyEvent applicationReadyEvent) {
		final var environment = applicationReadyEvent.getApplicationContext().getEnvironment();
		final var applicationName = environment.getProperty("spring.application.name");
		final var serverPort = environment.getProperty("server.port", "8080");
		final var contextPath = environment.getProperty("server.servlet.context-path", "/");

		log.info("");
		log.info("");
		log.info("===============================================================================");
		log.info("Successfully started {}!", applicationName);
		log.info("Local application URL: http://localhost:{}{}", serverPort, contextPath);
		log.info("===============================================================================");
		log.info("");
		log.info("");
	}

}
