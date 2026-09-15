package com.physim.config;

import com.physim.security.SessionAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final SessionAuthenticationFilter sessionAuthFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            SessionAuthenticationFilter sessionAuthFilter,
            @Value("${app.security.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174}") String allowedOriginsStr) {
        this.sessionAuthFilter = sessionAuthFilter;
        this.allowedOrigins = Arrays.stream(allowedOriginsStr.split(",")).map(String::trim).toList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .authorizeHttpRequests(auth -> auth
                // Public Health Check
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                // Public Auth Endpoints
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup", "/api/v1/auth/login").permitAll()
                .requestMatchers("/api/v1/auth/oauth/**").permitAll()
                // Public Share Endpoints
                .requestMatchers(HttpMethod.GET, "/api/v1/share/**").permitAll()
                // Swagger OpenAPI Documentation
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // Admin Endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // Teacher Endpoints (specific sub-routes handle student submissions/joins separately)
                .requestMatchers("/api/v1/teacher/classrooms/join", "/api/v1/teacher/classrooms/enrolled", "/api/v1/teacher/assignments/*/submit").authenticated()
                .requestMatchers("/api/v1/teacher/**").hasAnyRole("TEACHER", "ADMIN")
                // All other /api/v1 routes require authentication
                .requestMatchers("/api/v1/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(sessionAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization", "X-Requested-With", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
