from flask import Blueprint, request, jsonify
from models import db
from utils import verify_jwt

def create_crud_blueprint(name, model, auth_read=False, auth_write=True, admin_only=False):
    bp = Blueprint(f"{name}_bp", __name__)
    
    @bp.before_request
    def check_auth():
        # Determine if authentication is required for this request method
        needs_auth = auth_read if request.method == 'GET' else auth_write
        if not needs_auth and not admin_only:
            return
            
        # Enforce validation
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            token = request.cookies.get('remember_token')
            
        if not token:
            return jsonify({'success': False, 'message': 'Authorization token is missing.'}), 401
            
        user_info = verify_jwt(token)
        if not user_info:
            return jsonify({'success': False, 'message': 'Token is invalid or has expired.'}), 401
            
        # If mutating a administrative model, enforce Admin role
        admin_tables = ['universities_v2', 'departments_v2', 'courses_v2', 'faculty_v2', 'announcements_v2', 'gallery_v2', 'placements_v2', 'scholarships_v2', 'faqs_v2', 'settings_v2', 'users_v2', 'document_chunks_v2']
        if admin_only or (needs_auth and user_info.get('role') != 'Admin' and name in admin_tables):
            return jsonify({'success': False, 'message': 'Admin privileges required.'}), 403
            
        request.user = user_info

    # 1. GET ALL
    @bp.route('', methods=['GET'])
    def get_all():
        # Handle filtering if university_id is passed as query parameter
        univ_id = request.args.get('university_id')
        user_id = request.args.get('user_id')
        
        query = model.query
        
        # Relational filters
        if univ_id and hasattr(model, 'university_id'):
            query = query.filter_by(university_id=univ_id)
        if user_id and hasattr(model, 'user_id'):
            query = query.filter_by(user_id=user_id)
            
        # Support pagination and limiting
        limit = request.args.get('limit', type=int)
        page = request.args.get('page', type=int)
        
        total = query.count()
        
        if page and limit:
            query = query.offset((page - 1) * limit).limit(limit)
        elif limit:
            query = query.limit(limit)
            
        items = query.all()
        resp = jsonify([item.to_dict() for item in items])
        
        # Set pagination metadata in headers to preserve JSON array compatibility
        resp.headers['X-Total-Count'] = str(total)
        if limit:
            resp.headers['X-Limit'] = str(limit)
        if page:
            resp.headers['X-Page'] = str(page)
            import math
            resp.headers['X-Total-Pages'] = str(math.ceil(total / limit) if limit else 1)
            
        return resp

    # 2. GET SINGLE
    @bp.route('/<item_id>', methods=['GET'])
    def get_one(item_id):
        try:
            target_id = int(item_id)
        except ValueError:
            target_id = item_id
            
        item = model.query.get(target_id)
        if not item:
            return jsonify({'success': False, 'message': f'{model.__name__} not found.'}), 404
        return jsonify(item.to_dict())

    # 3. POST (CREATE)
    @bp.route('', methods=['POST'])
    def create():
        body = request.get_json() or {}
        columns = model.__table__.columns.keys()
        
        # Populate attributes
        init_args = {}
        for col in columns:
            if col == 'id' and not isinstance(model.__table__.primary_key.columns.values()[0].type, db.String):
                continue
            if col in body:
                init_args[col] = body[col]
                
        # Handle syllabus/recruiters JSON conversion if passed as dictionaries/lists
        if 'syllabus' in body and 'syllabus_json' in columns:
            import json
            init_args['syllabus_json'] = json.dumps(body['syllabus'])
        if 'top_recruiters' in body and 'top_recruiters_json' in columns:
            import json
            init_args['top_recruiters_json'] = json.dumps(body['top_recruiters'])
            
        new_item = model(**init_args)
        
        try:
            db.session.add(new_item)
            db.session.commit()
            return jsonify({'success': True, 'message': f'{model.__name__} created successfully.', 'data': new_item.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to create: {str(e)}'}), 400

    # 4. PUT (UPDATE)
    @bp.route('/<item_id>', methods=['PUT'])
    def update(item_id):
        try:
            target_id = int(item_id)
        except ValueError:
            target_id = item_id
            
        item = model.query.get(target_id)
        if not item:
            return jsonify({'success': False, 'message': f'{model.__name__} not found.'}), 404
            
        body = request.get_json() or {}
        columns = model.__table__.columns.keys()
        
        for col in columns:
            if col == 'id':
                continue
            if col in body:
                setattr(item, col, body[col])
                
        # Handle syllabus/recruiters JSON update
        if 'syllabus' in body and 'syllabus_json' in columns:
            import json
            item.syllabus_json = json.dumps(body['syllabus'])
        if 'top_recruiters' in body and 'top_recruiters_json' in columns:
            import json
            item.top_recruiters_json = json.dumps(body['top_recruiters'])
            
        try:
            db.session.commit()
            return jsonify({'success': True, 'message': f'{model.__name__} updated successfully.', 'data': item.to_dict()})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to update: {str(e)}'}), 400

    # 5. DELETE
    @bp.route('/<item_id>', methods=['DELETE'])
    def delete(item_id):
        try:
            target_id = int(item_id)
        except ValueError:
            target_id = item_id
            
        item = model.query.get(target_id)
        if not item:
            return jsonify({'success': False, 'message': f'{model.__name__} not found.'}), 404
            
        try:
            db.session.delete(item)
            db.session.commit()
            return jsonify({'success': True, 'message': f'{model.__name__} deleted successfully.'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to delete: {str(e)}'}), 400

    return bp
