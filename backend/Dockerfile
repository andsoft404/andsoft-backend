FROM php:8.2-apache

# Install PostgreSQL PDO driver
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy ALL project files (backend + admin + assets + index.html)
COPY . /var/www/html/

# Apache config - allow .htaccess
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/custom.conf \
    && a2enconf custom

# Use PORT environment variable (Render provides this)
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# PHP session directory
RUN mkdir -p /tmp/sessions && chmod 777 /tmp/sessions
RUN echo "session.save_path=/tmp/sessions" > /usr/local/etc/php/conf.d/sessions.ini

EXPOSE ${PORT}

CMD ["apache2-foreground"]
