FROM wordpress:latest

# Install WP-CLI
RUN apt-get update && \
    apt-get install -y less default-mysql-client && \
    curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x wp-cli.phar && \
    mv wp-cli.phar /usr/local/bin/wp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure www-data can run wp-cli
RUN echo "alias wp='wp --allow-root'" >> /root/.bashrc

# Copy custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["apache2-foreground"]