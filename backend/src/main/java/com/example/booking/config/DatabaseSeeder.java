package com.example.booking.config;

import com.example.booking.domain.Resource;
import com.example.booking.domain.ResourceStatus;
import com.example.booking.domain.ResourceType;
import com.example.booking.domain.Role;
import com.example.booking.domain.User;
import com.example.booking.repository.ResourceRepository;
import com.example.booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner initDatabase(ResourceRepository repository, UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User user = new User();
                user.setUsername("user01");
                user.setPassword("123456");
                user.setRole(Role.USER);
                userRepository.save(user);

                User admin = new User();
                admin.setUsername("admin01");
                admin.setPassword("123456");
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }

            if (repository.count() == 0) {
                for (int i = 1; i <= 5; i++) {
                    Resource desk = new Resource();
                    desk.setName("Desk " + i);
                    desk.setType(ResourceType.DESK);
                    desk.setStatus(ResourceStatus.ACTIVE);
                    repository.save(desk);
                }
                
                for (int i = 1; i <= 2; i++) {
                    Resource room = new Resource();
                    room.setName("Meeting Room " + i);
                    room.setType(ResourceType.ROOM);
                    room.setStatus(ResourceStatus.ACTIVE);
                    repository.save(room);
                }
            }
        };
    }
}
