package com.wandr;

import com.wandr.config.CloudinaryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CloudinaryProperties.class)
public class WandrBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(WandrBackendApplication.class, args);
  }
}
