package com.physim.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Physim Platform REST API")
                        .description("Comprehensive REST API for Physim Virtual Physics Simulation Platform supporting Student, Teacher, and Admin workflows.")
                        .version("1.0.0")
                        .contact(new Contact().name("Physim Engineering Team").email("engineering@physim.edu")))
                .addSecurityItem(new SecurityRequirement().addList("cookieAuth").addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("cookieAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("physim_session")
                                .description("Server-managed session cookie"))
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("HEX")
                                .description("Session token in Authorization header")));
    }
}
