info:

#   title: API de Agenda

  description: Acesso e gestão dos dados da agenda escolar  
  version: 1.0.0

servers:  
  \- url: http\://localhost:8000

components:  
  schemas:  
    EventoResposta:  
      type: object  
      properties:  
        id:  
          type: integer  
          example: 1  
        titulo:  
          type: string  
          example: "Feira de Ciências"  
        descricao:  
          type: string  
          nullable: true  
          example: "Apresentação dos projetos no pátio principal."  
        data\_inicio:  
          type: string  
          format: date  
          example: "2026-10-20"  
        data\_fim:  
          type: string  
          format: date  
          nullable: true  
          example: "2026-10-22"  
        hora\_inicio:  
          type: string  
          nullable: true  
          example: "08:00:00"  
        hora\_fim:  
          type: string  
          nullable: true  
          example: "12:00:00"  
        dia\_inteiro:  
          type: boolean  
          example: false  
        tipo:  
          type: string  
          example: "evento"  
        importante:  
          type: boolean  
          example: true  
        local:  
          type: string  
          nullable: true  
          example: "Pátio Central"  
        cor:  
          type: string  
          maxLength: 30  
          nullable: true  
          example: "\#4287f5"  
        criador\_id:  
          type: integer  
          description: "ID do usuário criador. Usado pelo front-end para diferenciar eventos próprios dos eventos do especialista."  
          example: 5  
        created\_at:  
          type: string  
          format: date-time  
        updated\_at:  
          type: string  
          format: date-time

    EventoRequisicao:  
      type: object  
      required:  
        \- titulo  
        \- data\_inicio  
      properties:  
        titulo:  
          type: string  
        descricao:  
          type: string  
          nullable: true  
        data\_inicio:  
          type: string  
          format: date  
        data\_fim:  
          type: string  
          format: date  
          nullable: true  
        hora\_inicio:  
          type: string  
          nullable: true  
        hora\_fim:  
          type: string  
          nullable: true  
        dia\_inteiro:  
          type: boolean  
          default: false  
        tipo:  
          type: string  
          default: "Eventos"  
        importante:  
          type: boolean  
          default: false  
        local:  
          type: string  
          nullable: true  
        cor:  
          type: string  
          maxLength: 30  
          nullable: true

    EventoAtualizacao:  
      type: object  
      description: Esquema para atualização parcial. Nenhum campo é obrigatório.  
      properties:  
        titulo:  
          type: string  
        descricao:  
          type: string  
          nullable: true  
        data\_inicio:  
          type: string  
          format: date  
        data\_fim:  
          type: string  
          format: date  
          nullable: true  
        hora\_inicio:  
          type: string  
          nullable: true  
        hora\_fim:  
          type: string  
          nullable: true  
        dia\_inteiro:  
          type: boolean  
        tipo:  
          type: string  
        importante:  
          type: boolean  
        local:  
          type: string  
          nullable: true  
        cor:  
          type: string  
          maxLength: 30  
          nullable: true

paths:  
  /eventos:  
    get:  
      summary: Busca os eventos autorizados para o usuário  
      description: Retorna uma lista contendo os eventos criados pelo próprio usuário autenticado e os eventos criados pelo perfil Especialista.  
      responses:  
        '200':  
          description: Lista de eventos retornada com sucesso.  
          content:  
            application/json:  
              schema:  
                type: array  
                items:  
                  \$ref: '\#/components/schemas/EventoResposta'

    post:  
      summary: Cria um novo evento  
      description: O criador\_id é extraído automaticamente do token de autenticação do usuário logado pelo back-end.  
      requestBody:  
        required: true  
        content:  
          application/json:  
            schema:  
              \$ref: '\#/components/schemas/EventoRequisicao'  
      responses:  
        '201':  
          description: Evento criado com sucesso.  
          content:  
            application/json:  
              schema:  
                \$ref: '\#/components/schemas/EventoResposta'

  /eventos/{id}:  
    parameters:  
      \- name: id  
        in: path  
        required: true  
        description: ID do evento  
        schema:  
          type: integer  
          example: 12

    patch:  
      summary: Atualiza parcialmente um evento  
      description: O back-end deve verificar se o usuário autenticado é o dono do evento (criador\_id) ou se possui privilégios de Especialista/Admin antes de permitir a alteração.  
      requestBody:  
        required: true  
        content:  
          application/json:  
            schema:  
              \$ref: '\#/components/schemas/EventoAtualizacao'  
      responses:  
        '200':  
          description: Evento atualizado com sucesso.  
          content:  
            application/json:  
              schema:  
                \$ref: '\#/components/schemas/EventoResposta'  
        '403':  
          description: Acesso negado. O usuário não tem permissão para editar este evento.  
        '404':  
          description: Evento não encontrado.

    delete:  
      summary: Exclui um evento  
      description: O back-end deve verificar se o usuário autenticado tem permissão para deletar este evento específico.  
      responses:  
        '204':  
          description: Evento excluído com sucesso (sem conteúdo de retorno).  
        '403':  
          description: Acesso negado. O usuário não tem permissão para deletar este evento.  
        '404':  
          description: Evento não encontrado.

