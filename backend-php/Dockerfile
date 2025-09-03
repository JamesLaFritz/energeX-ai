FROM php:8.2-fpm

# system deps
RUN apt-get update && apt-get install -y \
    git zip unzip libzip-dev libonig-dev libicu-dev \
    && docker-php-ext-install pdo pdo_mysql

# composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --no-dev

COPY . .

# permissions for storage/bootstrap
RUN mkdir -p storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache

CMD ["php-fpm"]
