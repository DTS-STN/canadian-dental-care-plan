package ca.gov.dtsstn.cdcp.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SampleControllerTest {

	@Test
	void testGetSamples_shouldReturnHelloWorld() {
		final SampleController controller = new SampleController();
		final String response = controller.getSamples();
		assertEquals("Hello world!", response);
	}

}