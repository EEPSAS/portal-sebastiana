# Imagem oficial do PHP 8.5 enxuta (Alpine) compatível com os requisitos do composer.json (^8.5)
FROM php:8.5-cli-alpine

# Instala dependências de sistema e bibliotecas para compilar extensões PostgreSQL, Zip e String
RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-dev \
    libpq-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    && docker-php-ext-install \
    bcmath \
    intl \
    mbstring \
    opcache \
    pcntl \
    pdo_pgsql \
    pgsql \
    zip

# Copia o binário oficial do Composer para gerenciamento de pacotes PHP
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copia arquivos de manifesto primeiro para aproveitar o cache de camadas do Docker no deploy
COPY composer.json composer.lock ./

# Instala dependências de produção otimizando o autoloader sem carregar pacotes de desenvolvimento
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

# Copia o restante do código-fonte da API Laravel
COPY . .

# Finaliza o dump do autoloader e garante permissões de escrita em storage e cache
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Porta padrão exposta pelo container (o Render injeta a variável $PORT dinamicamente)
EXPOSE 8000

# Comando de inicialização: cria link de storage, aplica migrations em produção e sobe o servidor HTTP
CMD ["sh", "-c", "php artisan storage:link --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
